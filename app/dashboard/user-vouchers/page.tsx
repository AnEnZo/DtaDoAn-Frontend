'use client';

import React, { useEffect, useState } from 'react';
import { Card, Space, Input, Button, Typography, Modal, Image, Alert, Badge, Tag, Row, Col, Empty, Tooltip } from 'antd';
import Link from 'next/link';
import { QrcodeOutlined, HomeOutlined, GiftOutlined, SearchOutlined, ReloadOutlined, TrophyOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import { apiGet, apiPost, request } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';
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
            const data = await apiGet<any>(`/api/vouchers?username=${username}`);

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
            setError(getErrorMessage(err, '❌ Không thể tải danh sách voucher'));
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
            const data = await apiGet<UsedVoucher[]>(`/api/user-vouchers/${username}`);
            setUsedVouchers(data);
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err, '❌ Không thể tải các voucher đã đổi'));
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
            await apiPost(
                `/api/user-vouchers/exchange?username=${encodeURIComponent(username)}&voucherCode=${encodeURIComponent(voucher.code)}`
            );

            setMsg(`🎉 Đổi voucher ${voucher.code} thành công!`);
            await fetchAll();
            setTimeout(() => setMsg(''), 3000);
        } catch (err: any) {
            console.error(err);
            setError(getErrorMessage(err, '❌ Lỗi khi đổi voucher.'));
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
        v.type === 'BUY_ONE_GET_ONE'
            ? 'Tặng 1 sản phẩm'
            : v.type === 'PERCENTAGE_DISCOUNT'
                ? `${v.discountValue}%`
                : `${v.discountValue.toLocaleString()}₫`;

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
        <div className="vouchers-page-container">
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
                    <Row gutter={[16, 16]} align="middle" justify="space-between">
                        <Col xs={24} md={18}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                                {isUserOnly && (
                                    <Link href="/home" style={{ width: 'auto' }}>
                                        <Button icon={<HomeOutlined />} size="large" style={{ background: '#8b4513', color: 'white', border: 'none', width: '100%' }}>
                                            Về Trang chủ
                                        </Button>
                                    </Link>
                                )}
                                <div style={{ display: 'flex', gap: 8, flex: '1 1 auto', minWidth: 200, maxWidth: '100%' }}>
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Tìm voucher..."
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        style={{ flex: 1 }}
                                        onPressEnter={handleSearch}
                                    />
                                    <Button onClick={handleSearch} icon={<SearchOutlined />} type="primary" style={{ background: '#8b4513', borderColor: '#8b4513' }}>
                                        Tìm
                                    </Button>
                                </div>
                                <Button onClick={fetchAll} icon={<ReloadOutlined />} style={{ flex: '0 0 auto' }}>
                                    Làm mới
                                </Button>
                            </div>
                        </Col>
                        <Col xs={24} md={6}>
                            <Button
                                type="primary"
                                size="large"
                                icon={<QrcodeOutlined />}
                                onClick={fetchUsedVouchers}
                                style={{ background: '#cd853f', borderColor: '#cd853f', width: '100%' }}
                            >
                                Xem voucher đã đổi
                            </Button>
                        </Col>
                    </Row>
                    {msg && <Alert type="success" message={msg} showIcon style={{ marginTop: 12 }} closable />}
                    {error && <Alert type="error" message={error} showIcon style={{ marginTop: 12 }} closable />}
                </Card>

                {/* Available Vouchers — CSS Grid để các thẻ cùng hàng luôn cao bằng nhau */}
                {filtered.length === 0 ? (
                    <Empty description="Không có voucher phù hợp" style={{ padding: '40px 0' }} />
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: 16,
                            alignItems: 'stretch',
                        }}
                    >
                        {filtered.map((v) => {
                            const canExchange = userPoints >= v.requiredPoints;
                            return (
                                <div key={v.id} style={{ position: 'relative', height: '100%' }}>
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
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                    styles={{ body: { flex: 1 } }}
                                    cover={
                                        <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                                            <Image
                                                src={v.imageUrl || imgDefault}
                                                fallback={imgDefault}
                                                alt={v.code}
                                                width="100%"
                                                height={160}
                                                style={{ objectFit: 'cover', display: 'block' }}
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
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>
                                            {v.type === 'BUY_ONE_GET_ONE' ? 'Ưu đãi' : 'Giảm giá'}
                                        </div>
                                        <div style={{ fontSize: v.type === 'BUY_ONE_GET_ONE' ? '1.25rem' : '1.75rem', fontWeight: 700, color: '#ea580c', minHeight: '2.1rem', display: 'flex', alignItems: 'center' }}>{fmtVal(v)}</div>
                                    </div>
                                    <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 12, fontSize: '0.9rem', color: '#6b7280' }}>
                                        <div>Đơn tối thiểu: <strong>{v.minOrderAmount.toLocaleString()}₫</strong></div>
                                    </div>
                                </Card>
                                </div>
                            );
                        })}
                    </div>
                )}

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
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                    gap: 16,
                                    alignItems: 'stretch',
                                }}
                            >
                                {usedVouchers.map((uv) => (
                                    <div key={uv.id} style={{ height: '100%' }}>
                                        <Badge.Ribbon text={uv.used ? 'Đã dùng' : 'Chưa dùng'} color={uv.used ? 'gray' : 'green'}>
                                            <Card
                                                hoverable
                                                style={{
                                                    borderRadius: 12,
                                                    border: '2px solid #deb887',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                }}
                                                styles={{ body: { flex: 1 } }}
                                                cover={
                                                    <div style={{ width: '100%', height: 160, overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                                                        <Image
                                                            src={uv.voucher.imageUrl || imgDefault}
                                                            fallback={imgDefault}
                                                            alt={uv.voucher.code}
                                                            width="100%"
                                                            height={160}
                                                            style={{ objectFit: 'cover', display: 'block' }}
                                                            preview={false}
                                                        />
                                                    </div>
                                                }
                                                actions={[
                                                    <Button
                                                        key="qr"
                                                        icon={<QrcodeOutlined />}
                                                        onClick={async () => {
                                                            const token = getToken();
                                                            if (!token) return;
                                                            try {
                                                                const qrRes = await request<Response>(
                                                                    `/api/user-vouchers/${uv.id}/qrcode`,
                                                                    { parseJson: false }
                                                                );
                                                                const buffer = await qrRes.arrayBuffer();
                                                                const base64 = await arrayBufferToBase64(buffer);
                                                                const dataUrl = `data:image/png;base64,${base64}`;
                                                                setQrImage(dataUrl);
                                                                setSelectedVoucher(uv);
                                                                setQrModalOpen(true);
                                                            } catch (err) {
                                                                console.error('Lỗi khi tải QR code', err);
                                                                setError(getErrorMessage(err, 'Không thể tải mã QR.'));
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
                                                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                        {uv.voucher.type === 'BUY_ONE_GET_ONE' ? 'Ưu đãi' : 'Giảm'}
                                                    </div>
                                                    <div style={{ fontSize: uv.voucher.type === 'BUY_ONE_GET_ONE' ? '1.2rem' : '1.5rem', fontWeight: 700, color: '#ea580c', minHeight: '1.9rem', display: 'flex', alignItems: 'center' }}>{fmtVal(uv.voucher)}</div>
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
                                    </div>
                                ))}
                            </div>
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
                    title={null}
                    centered
                    width={400}
                    styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: 12 } }}
                >
                    {selectedVoucher && (
                        <div>
                            {/* Header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #8b4513 0%, #cd853f 100%)',
                                padding: '28px 24px 22px',
                                textAlign: 'center',
                                color: '#fff',
                            }}>
                                <div style={{
                                    width: 56, height: 56, margin: '0 auto 12px', borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.18)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: 26,
                                }}>
                                    <GiftOutlined />
                                </div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: 0.5 }}>
                                    {selectedVoucher.voucher.code}
                                </div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: 4 }}>
                                    Quét mã này tại quầy thanh toán
                                </div>
                            </div>

                            {/* QR */}
                            <div style={{ padding: '24px 24px 8px', textAlign: 'center', background: '#fff' }}>
                                <div style={{
                                    display: 'inline-block', padding: 16, background: '#fff',
                                    borderRadius: 16, boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
                                    border: '1px solid #f0e6d8',
                                }}>
                                    {qrImage ? (
                                        <Image src={qrImage} alt="QR Code" width={220} preview={false} />
                                    ) : (
                                        <div style={{
                                            width: 220, height: 220, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
                                        }}>
                                            <QrcodeOutlined style={{ fontSize: 48 }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Offer ticket */}
                            <div style={{ padding: '8px 24px 24px', background: '#fff' }}>
                                <div style={{
                                    background: '#fff7ed', border: '1px dashed #f0a868',
                                    borderRadius: 12, padding: 16, textAlign: 'center',
                                }}>
                                    <Tag color="orange" style={{ marginBottom: 8, borderRadius: 10, fontWeight: 600 }}>
                                        {fmtType(selectedVoucher.voucher.type)}
                                    </Tag>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ea580c' }}>
                                        {selectedVoucher.voucher.type === 'BUY_ONE_GET_ONE'
                                            ? fmtVal(selectedVoucher.voucher)
                                            : `Giảm ${fmtVal(selectedVoucher.voucher)}`}
                                    </div>
                                    {selectedVoucher.voucher.minOrderAmount > 0 && (
                                        <div style={{ fontSize: '0.8rem', color: '#9a7b5a', marginTop: 4 }}>
                                            Đơn tối thiểu {selectedVoucher.voucher.minOrderAmount.toLocaleString()}₫
                                        </div>
                                    )}
                                    <div style={{
                                        fontSize: '0.85rem', color: '#6b7280', marginTop: 10,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    }}>
                                        <ClockCircleOutlined /> {getTimeRemaining(selectedVoucher.expiryAt)}
                                        <span style={{ color: '#d1d5db' }}>•</span>
                                        Hết hạn {new Date(selectedVoucher.expiryAt).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
}
