'use client';

import React, { useEffect, useState } from 'react';
import { Card, Space, Input, Button, List, Typography, Modal, Image, Alert, Badge, Tag, Row, Col, Empty, Tooltip, message } from 'antd';
import Link from 'next/link';
import { QrcodeOutlined, HomeOutlined, GiftOutlined, SearchOutlined, ReloadOutlined, TrophyOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import { API_URL } from '@/lib/api/client';
import { getToken, parseJwt } from '@/lib/auth/auth-utils';
import { useAuth } from '@/lib/hooks/useAuth';

interface Voucher {
    id: number;
    code: string;
    type: 'PERCENTAGE_DISCOUNT' | 'BUY_ONE_GET_ONE' | 'FIXED_DISCOUNT';
    discountValue: number;
    minOrderAmount: number;
    active: boolean;
    requiredPoints: number;
    imageUrl?: string;
}

interface UsedVoucher {
    id: number;
    code: string;
    qrCode: string;
    expiryAt: string;
    used: boolean;
    voucher: Voucher;
}

const imgDefault = '/images/imgdefaultVoucher.png';

export default function UserVoucherManagerPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [filtered, setFiltered] = useState<Voucher[]>([]);
    const [usedVouchers, setUsedVouchers] = useState<UsedVoucher[]>([]);
    const [userPoints, setUserPoints] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [loadingUsedVouchers, setLoadingUsedVouchers] = useState<boolean>(false);
    const [usedVoucherLoaded, setUsedVoucherLoaded] = useState<boolean>(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [selectedVoucher, setSelectedVoucher] = useState<UsedVoucher | null>(null);

    const { user } = useAuth();
    const username = user?.sub || '';
    const roles = user?.roles || [];
    const isUserOnly = roles.includes('ROLE_USER') && !roles.includes('ROLE_ADMIN') && !roles.includes('ROLE_STAFF');

    const fetchAll = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/vouchers?username=${username}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch vouchers');
            const data = await res.json();

            if (data.userPoints !== undefined) {
                setVouchers(data.vouchers);
                setFiltered(data.vouchers);
                setUserPoints(data.userPoints);
            } else {
                setVouchers(data);
                setFiltered(data);
                setUserPoints(0);
            }
        } catch (err) {
            console.error(err);
            setError('❌ Không thể tải danh sách voucher');
        }
    };

    useEffect(() => {
        if (username) fetchAll();
    }, [username]);

    const fetchUsedVouchers = async () => {
        setLoadingUsedVouchers(true);
        setError('');
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/user-vouchers/${username}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch used vouchers');
            const data = await res.json();
            setUsedVouchers(data);
        } catch (err) {
            console.error(err);
            setError('❌ Không thể tải các voucher đã đổi');
        } finally {
            setLoadingUsedVouchers(false);
            setUsedVoucherLoaded(true);
        }
    };

    const handleSearch = () => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) {
            setFiltered(vouchers);
            return;
        }
        const result = vouchers.filter((v) => v.code.toLowerCase().includes(keyword));
        setFiltered(result);
    };

    const handleExchange = async (voucher: Voucher) => {
        setMsg('');
        setError('');

        if (userPoints < voucher.requiredPoints) {
            setError(`⚠️ Bạn cần ${voucher.requiredPoints} điểm nhưng chỉ có ${userPoints} điểm.`);
            return;
        }

        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(
                `${API_URL}/api/user-vouchers/exchange?username=${encodeURIComponent(username)}&voucherCode=${encodeURIComponent(voucher.code)}`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) {
                if (res.status === 400) throw new Error('⚠️ Không đủ điểm hoặc không hợp lệ.');
                throw new Error('❌ Lỗi khi đổi voucher.');
            }

            setMsg(`🎉 Đổi voucher ${voucher.code} thành công!`);
            await fetchAll();
            setTimeout(() => setMsg(''), 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        }
    };

    const arrayBufferToBase64 = (buffer: ArrayBuffer): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                resolve(base64String.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(new Blob([buffer]));
        });
    };

    const fmtType = (type: string) =>
        type === 'PERCENTAGE_DISCOUNT' ? 'Phần trăm' : type === 'FIXED_DISCOUNT' ? 'Giảm cố định' : 'Mua 1 tặng 1';

    const fmtVal = (v: Voucher) =>
        v.type === 'PERCENTAGE_DISCOUNT' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()}₫`;

    const isHighValue = (v: Voucher) => {
        if (v.type === 'PERCENTAGE_DISCOUNT') return v.discountValue >= 20;
        if (v.type === 'FIXED_DISCOUNT') return v.discountValue >= 50000;
        return false;
    };

    const getTimeRemaining = (expiryAt: string) => {
        const now = new Date().getTime();
        const expiry = new Date(expiryAt).getTime();
        const diff = expiry - now;

        if (diff < 0) return 'Đã hết hạn';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `Còn ${days} ngày`;
        if (hours > 0) return `Còn ${hours} giờ`;
        return 'Sắp hết hạn';
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* Header with Points */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col span={24}>
                        <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #8b4513, #cd853f)', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                                <div>
                                    <Typography.Title level={3} style={{ margin: 0, color: 'white' }}>
                                        🎁 Đổi Voucher
                                    </Typography.Title>
                                    <Typography.Text style={{ color: 'rgba(255,255,255,0.9)' }}>Sử dụng điểm tích lũy để đổi voucher giảm giá</Typography.Text>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>Điểm của bạn</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                                        <TrophyOutlined /> {userPoints}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Controls */}
                <Card style={{ marginBottom: 24, borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <Space wrap style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space wrap>
                            {isUserOnly && (
                                <Link href="/home">
                                    <Button icon={<HomeOutlined />} size="large" style={{ background: '#8b4513', color: 'white', border: 'none' }}>
                                        Về Trang chủ
                                    </Button>
                                </Link>
                            )}
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm voucher..."
                                allowClear
                                prefix={<SearchOutlined />}
                                style={{ width: 220 }}
                                onPressEnter={handleSearch}
                            />
                            <Button onClick={handleSearch} icon={<SearchOutlined />}>Tìm</Button>
                            <Button onClick={fetchAll} icon={<ReloadOutlined />}>Làm mới</Button>
                        </Space>
                        <Button
                            type="primary"
                            size="large"
                            icon={<QrcodeOutlined />}
                            onClick={fetchUsedVouchers}
                            style={{ background: '#cd853f', borderColor: '#cd853f' }}
                        >
                            Xem voucher đã đổi
                        </Button>
                    </Space>
                    {msg && <Alert type="success" message={msg} showIcon style={{ marginTop: 12 }} closable />}
                    {error && <Alert type="error" message={error} showIcon style={{ marginTop: 12 }} closable />}
                </Card>

                {/* Available Vouchers */}
                <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                    dataSource={filtered}
                    renderItem={(v) => {
                        const canExchange = userPoints >= v.requiredPoints;
                        return (
                            <List.Item>
                                {isHighValue(v) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 12,
                                        right: -8,
                                        background: 'linear-gradient(135deg, #dc2626, #f59e0b)',
                                        color: 'white',
                                        padding: '4px 16px',
                                        borderRadius: '20px 0 0 20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        zIndex: 10,
                                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                                    }}>
                                        <FireOutlined /> HOT
                                    </div>
                                )}
                                <Card
                                    hoverable={canExchange}
                                    style={{
                                        borderRadius: 12,
                                        border: canExchange ? '2px solid #8b4513' : '2px solid #e5e7eb',
                                        boxShadow: canExchange ? '0 8px 24px rgba(139, 69, 19, 0.2)' : '0 4px 12px rgba(0,0,0,0.08)',
                                        transition: 'all 0.3s ease',
                                        opacity: canExchange ? 1 : 0.7,
                                    }}
                                    cover={
                                        <div style={{ position: 'relative' }}>
                                            <Image
                                                src={v.imageUrl || imgDefault}
                                                fallback={imgDefault}
                                                alt={v.code}
                                                height={160}
                                                style={{ objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                                                preview={false}
                                            />
                                            <Tag
                                                color={v.type === 'PERCENTAGE_DISCOUNT' ? 'orange' : v.type === 'FIXED_DISCOUNT' ? 'green' : 'blue'}
                                                style={{ position: 'absolute', top: 12, left: 12, fontSize: '0.85rem', fontWeight: 600 }}
                                            >
                                                {fmtType(v.type)}
                                            </Tag>
                                        </div>
                                    }
                                    actions={[
                                        <Tooltip title={!canExchange ? `Cần ${v.requiredPoints - userPoints} điểm nữa` : ''} key="exchange">
                                            <Button
                                                type="primary"
                                                onClick={() => handleExchange(v)}
                                                disabled={!canExchange}
                                                block
                                                size="large"
                                                icon={<GiftOutlined />}
                                                style={{
                                                    background: canExchange ? '#8b4513' : '#e5e7eb',
                                                    borderColor: canExchange ? '#8b4513' : '#e5e7eb',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Đổi ngay ({v.requiredPoints} đ)
                                            </Button>
                                        </Tooltip>,
                                    ]}
                                >
                                    <Typography.Title level={4} style={{ margin: '0 0 12px 0', color: '#1f2937' }}>
                                        {v.code}
                                    </Typography.Title>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>Giảm giá</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ea580c' }}>{fmtVal(v)}</div>
                                    </div>
                                    <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 12, fontSize: '0.9rem', color: '#6b7280' }}>
                                        <div>Đơn tối thiểu: <strong>{v.minOrderAmount.toLocaleString()}₫</strong></div>
                                    </div>
                                </Card>
                            </List.Item>
                        );
                    }}
                />

                {/* Used Vouchers Section */}
                {usedVoucherLoaded && (
                    <Card
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <QrcodeOutlined style={{ fontSize: 24, color: '#8b4513' }} />
                                <span>Voucher Đã Đổi</span>
                            </div>
                        }
                        style={{ marginTop: 24, borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    >
                        {loadingUsedVouchers ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
                        ) : usedVouchers.length === 0 ? (
                            <Empty
                                description="Bạn chưa đổi voucher nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                style={{ padding: 40 }}
                            >
                                <Button type="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: '#8b4513', borderColor: '#8b4513' }}>
                                    Đổi voucher ngay
                                </Button>
                            </Empty>
                        ) : (
                            <List
                                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                                dataSource={usedVouchers}
                                renderItem={(uv) => (
                                    <List.Item>
                                        <Badge.Ribbon text={uv.used ? 'Đã dùng' : 'Chưa dùng'} color={uv.used ? 'gray' : 'green'}>
                                            <Card
                                                hoverable
                                                style={{
                                                    borderRadius: 12,
                                                    border: '2px solid #deb887',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                }}
                                                cover={
                                                    <Image
                                                        src={uv.voucher.imageUrl || imgDefault}
                                                        fallback={imgDefault}
                                                        alt={uv.voucher.code}
                                                        height={160}
                                                        style={{ objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                                                        preview={false}
                                                    />
                                                }
                                                actions={[
                                                    <Button
                                                        key="qr"
                                                        icon={<QrcodeOutlined />}
                                                        onClick={async () => {
                                                            const token = getToken();
                                                            if (!token) return;
                                                            try {
                                                                const qrRes = await fetch(
                                                                    `${API_URL}/api/user-vouchers/${uv.id}/qrcode`,
                                                                    {
                                                                        headers: { Authorization: `Bearer ${token}` },
                                                                    }
                                                                );
                                                                if (!qrRes.ok) throw new Error('Failed to fetch QR');
                                                                const buffer = await qrRes.arrayBuffer();
                                                                const base64 = await arrayBufferToBase64(buffer);
                                                                const dataUrl = `data:image/png;base64,${base64}`;
                                                                setQrImage(dataUrl);
                                                                setSelectedVoucher(uv);
                                                                setQrModalOpen(true);
                                                            } catch (err) {
                                                                console.error('Lỗi khi tải QR code', err);
                                                                setError('Không thể tải mã QR.');
                                                            }
                                                        }}
                                                        block
                                                        size="large"
                                                        style={{ background: '#cd853f', color: 'white', border: 'none', fontWeight: 600 }}
                                                    >
                                                        Xem QR Code
                                                    </Button>,
                                                ]}
                                            >
                                                <Typography.Title level={5} style={{ marginTop: 0, color: '#1f2937' }}>
                                                    {uv.voucher.code}
                                                </Typography.Title>
                                                <div style={{ marginBottom: 8 }}>
                                                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Giảm</div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ea580c' }}>{fmtVal(uv.voucher)}</div>
                                                </div>
                                                <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 8, fontSize: '0.85rem', color: '#6b7280' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                        <ClockCircleOutlined />
                                                        <span>{getTimeRemaining(uv.expiryAt)}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem' }}>
                                                        Hết hạn: {new Date(uv.expiryAt).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </div>
                                            </Card>
                                        </Badge.Ribbon>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                )}

                {/* QR Modal */}
                <Modal
                    open={qrModalOpen}
                    onCancel={() => {
                        setQrModalOpen(false);
                        setSelectedVoucher(null);
                    }}
                    footer={null}
                    title={
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{selectedVoucher?.voucher.code}</div>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: 4 }}>Quét mã này tại quầy thanh toán</div>
                        </div>
                    }
                    centered
                    width={500}
                >
                    {qrImage && (
                        <div style={{ textAlign: 'center', padding: 24 }}>
                            <div style={{
                                background: '#f9fafb',
                                padding: 24,
                                borderRadius: 12,
                                marginBottom: 16,
                                display: 'inline-block',
                            }}>
                                <Image src={qrImage} alt="QR Code" width={300} preview={false} />
                            </div>
                            {selectedVoucher && (
                                <div style={{
                                    background: '#fef3e2',
                                    padding: 16,
                                    borderRadius: 8,
                                    border: '1px solid #d4a574',
                                }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ea580c', marginBottom: 8 }}>
                                        Giảm {fmtVal(selectedVoucher.voucher)}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                        <ClockCircleOutlined /> {getTimeRemaining(selectedVoucher.expiryAt)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
}
