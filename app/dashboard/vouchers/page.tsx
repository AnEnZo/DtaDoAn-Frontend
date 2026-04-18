'use client';

import React, { useEffect, useState } from 'react';
import {
    Card,
    Space,
    Input,
    Button,
    Modal,
    Form,
    InputNumber,
    Select,
    Switch,
    List,
    Typography,
    Popconfirm,
    Badge,
    Row,
    Col,
    Statistic,
    message,
} from 'antd';
import {
    GiftOutlined,
    PercentageOutlined,
    DollarOutlined,
    TagsOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

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

const imgdefaultVoucher = '/images/imgdefaultVoucher.png'; // Assuming you have this or will use a placeholder

export default function VoucherManagerPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [filtered, setFiltered] = useState<Voucher[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [form, setForm] = useState<Omit<Voucher, 'id'>>({
        code: '',
        type: 'PERCENTAGE_DISCOUNT',
        discountValue: 0,
        minOrderAmount: 0,
        active: true,
        requiredPoints: 0,
        imageUrl: '',
    });
    const [addOpen, setAddOpen] = useState<boolean>(false);
    const [editOpen, setEditOpen] = useState<boolean>(false);
    const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);

    const fetchAll = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/vouchers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch vouchers');
            const data: Voucher[] = await response.json();
            setVouchers(data);
            applyFilters(data, filterType, filterStatus, searchTerm);
        } catch (e) {
            console.error(e);
            message.error('Không thể tải danh sách voucher');
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        applyFilters(vouchers, filterType, filterStatus, searchTerm);
    }, [filterType, filterStatus, searchTerm]);

    const applyFilters = (data: Voucher[], type: string, status: string, search: string) => {
        let result = data;

        if (type !== 'ALL') {
            result = result.filter(v => v.type === type);
        }

        if (status === 'ACTIVE') {
            result = result.filter(v => v.active);
        } else if (status === 'INACTIVE') {
            result = result.filter(v => !v.active);
        }

        if (search.trim()) {
            const keyword = search.trim().toLowerCase();
            result = result.filter(v => v.code.toLowerCase().includes(keyword));
        }

        setFiltered(result);
    };

    const handleSubmit = async () => {
        if (!form.code.trim()) {
            message.error('Mã voucher không thể trống');
            return;
        }
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/vouchers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error('Failed to create voucher');

            message.success('Thêm voucher thành công');
            setForm({
                code: '',
                type: 'PERCENTAGE_DISCOUNT',
                discountValue: 0,
                minOrderAmount: 0,
                active: true,
                requiredPoints: 0,
                imageUrl: '',
            });
            setAddOpen(false);
            await fetchAll();
        } catch (e) {
            console.error(e);
            message.error('Thêm thất bại');
        }
    };

    const handleDelete = async (id: number) => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/vouchers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to delete voucher');

            message.success('Xóa thành công');
            await fetchAll();
        } catch (e) {
            console.error(e);
            message.error('Xóa thất bại, kiểm tra ràng buộc');
        }
    };

    const handleToggleActive = async (voucher: Voucher) => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/vouchers/${voucher.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...voucher, active: !voucher.active }),
            });

            if (!res.ok) throw new Error('Failed to update voucher');

            message.success(`${!voucher.active ? 'Kích hoạt' : 'Tắt'} voucher thành công`);
            await fetchAll();
        } catch (e) {
            console.error(e);
            message.error('Cập nhật thất bại');
        }
    };

    const handleOpenEdit = (v: Voucher) => {
        setEditVoucher(v);
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editVoucher) return;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/vouchers/${editVoucher.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editVoucher),
            });

            if (!res.ok) throw new Error('Failed to update voucher');

            message.success('Cập nhật thành công');
            setEditOpen(false);
            await fetchAll();
        } catch (error) {
            console.error(error);
            message.error('Cập nhật thất bại');
        }
    };

    const fmtType = (t: string) =>
        t === 'PERCENTAGE_DISCOUNT' ? 'Phần trăm' : t === 'FIXED_DISCOUNT' ? 'Giảm cố định' : 'Mua 1 tặng 1';

    const fmtVal = (v: Voucher) =>
        v.type === 'PERCENTAGE_DISCOUNT' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()}₫`;

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'PERCENTAGE_DISCOUNT': return '#8b4513';
            case 'FIXED_DISCOUNT': return '#cd853f';
            case 'BUY_ONE_GET_ONE': return '#deb887';
            default: return '#8b4513';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'PERCENTAGE_DISCOUNT': return <PercentageOutlined />;
            case 'FIXED_DISCOUNT': return <DollarOutlined />;
            case 'BUY_ONE_GET_ONE': return <GiftOutlined />;
            default: return <TagsOutlined />;
        }
    };

    const stats = {
        total: vouchers.length,
        active: vouchers.filter(v => v.active).length,
        inactive: vouchers.filter(v => !v.active).length,
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <Typography.Title level={3} style={{ margin: 0, marginBottom: 8, color: '#1f2937' }}>
                        🎫 Quản lý Voucher
                    </Typography.Title>
                    <Typography.Text type="secondary">Tạo và quản lý các voucher giảm giá</Typography.Text>
                </div>

                {/* Statistics */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            <Statistic title="Tổng Vouchers" value={stats.total} prefix={<TagsOutlined />} valueStyle={{ color: '#8b4513' }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            <Statistic title="Đang Kích Hoạt" value={stats.active} prefix={<GiftOutlined />} valueStyle={{ color: '#16a34a' }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            <Statistic title="Không Hoạt Động" value={stats.inactive} prefix={<GiftOutlined />} valueStyle={{ color: '#9ca3af' }} />
                        </Card>
                    </Col>
                </Row>

                {/* Controls */}
                <Card style={{ marginBottom: 24, borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space wrap>
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm mã voucher..."
                                allowClear
                                prefix={<SearchOutlined />}
                                style={{ width: 220 }}
                            />
                            <Select
                                value={filterType}
                                onChange={setFilterType}
                                style={{ width: 160 }}
                                options={[
                                    { label: 'Tất cả loại', value: 'ALL' },
                                    { label: 'Phần trăm', value: 'PERCENTAGE_DISCOUNT' },
                                    { label: 'Giảm cố định', value: 'FIXED_DISCOUNT' },
                                    { label: 'Mua 1 tặng 1', value: 'BUY_ONE_GET_ONE' },
                                ]}
                            />
                            <Select
                                value={filterStatus}
                                onChange={setFilterStatus}
                                style={{ width: 140 }}
                                options={[
                                    { label: 'Tất cả', value: 'ALL' },
                                    { label: 'Hoạt động', value: 'ACTIVE' },
                                    { label: 'Không hoạt động', value: 'INACTIVE' },
                                ]}
                            />
                        </Space>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={fetchAll}>Làm mới</Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)} style={{ background: '#8b4513', borderColor: '#8b4513' }}>
                                Thêm Voucher
                            </Button>
                        </Space>
                    </Space>
                </Card>

                {/* Voucher Grid */}
                <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                    dataSource={filtered}
                    renderItem={(v) => (
                        <List.Item>
                            <Badge.Ribbon text={v.active ? 'Hoạt động' : 'Tắt'} color={v.active ? 'green' : 'gray'}>
                                <Card
                                    hoverable
                                    style={{
                                        borderRadius: 12,
                                        border: `2px solid ${getTypeColor(v.type)}40`,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        transition: 'all 0.3s ease',
                                    }}
                                    cover={
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={v.imageUrl || imgdefaultVoucher}
                                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = imgdefaultVoucher; }}
                                                alt={v.code}
                                                style={{ height: 160, objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: 12,
                                                left: 12,
                                                background: getTypeColor(v.type),
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: 20,
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}>
                                                {getTypeIcon(v.type)} {fmtType(v.type)}
                                            </div>
                                        </div>
                                    }
                                    actions={[
                                        <Switch
                                            key="toggle"
                                            checked={v.active}
                                            onChange={() => handleToggleActive(v)}
                                            checkedChildren="ON"
                                            unCheckedChildren="OFF"
                                        />,
                                        <Button key="edit" icon={<EditOutlined />} onClick={() => handleOpenEdit(v)} size="small">
                                            Sửa
                                        </Button>,
                                        <Popconfirm key="del" title="Xóa voucher này?" onConfirm={() => handleDelete(v.id)}>
                                            <Button danger icon={<DeleteOutlined />} size="small">Xóa</Button>
                                        </Popconfirm>,
                                    ]}
                                >
                                    <Typography.Title level={4} style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
                                        {v.code}
                                    </Typography.Title>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>Giảm giá</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ea580c' }}>{fmtVal(v)}</div>
                                    </div>
                                    <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 12, fontSize: '0.9rem' }}>
                                        <div style={{ marginBottom: 6, color: '#6b7280' }}>
                                            <strong>Đơn tối thiểu:</strong> {v.minOrderAmount.toLocaleString()}₫
                                        </div>
                                        <div style={{ color: '#6b7280' }}>
                                            <strong>Điểm yêu cầu:</strong> {v.requiredPoints}
                                        </div>
                                    </div>
                                </Card>
                            </Badge.Ribbon>
                        </List.Item>
                    )}
                />

                {/* Modals */}
                <Modal
                    title="Thêm Voucher Mới"
                    open={addOpen}
                    onOk={handleSubmit}
                    onCancel={() => setAddOpen(false)}
                    okText="Thêm"
                    cancelText="Hủy"
                    okButtonProps={{ style: { background: '#8b4513', borderColor: '#8b4513' } }}
                    width={600}
                >
                    <Form layout="vertical" style={{ marginTop: 24 }}>
                        <Form.Item label="Mã Voucher" required>
                            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="VD: SUMMER2024" />
                        </Form.Item>
                        <Form.Item label="Loại Voucher">
                            <Select
                                value={form.type}
                                onChange={(v) => setForm({ ...form, type: v })}
                                options={[
                                    { label: 'Giảm theo phần trăm', value: 'PERCENTAGE_DISCOUNT' },
                                    { label: 'Giảm cố định', value: 'FIXED_DISCOUNT' },
                                    { label: 'Mua 1 tặng 1', value: 'BUY_ONE_GET_ONE' },
                                ]}
                            />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Giá trị giảm">
                                    <InputNumber
                                        value={form.discountValue}
                                        onChange={(v) => setForm({ ...form, discountValue: Number(v) })}
                                        style={{ width: '100%' }}
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Đơn tối thiểu (₫)">
                                    <InputNumber
                                        value={form.minOrderAmount}
                                        onChange={(v) => setForm({ ...form, minOrderAmount: Number(v) })}
                                        style={{ width: '100%' }}
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Điểm yêu cầu">
                                    <InputNumber
                                        value={form.requiredPoints}
                                        onChange={(v) => setForm({ ...form, requiredPoints: Number(v) })}
                                        style={{ width: '100%' }}
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Kích hoạt" valuePropName="checked">
                                    <Switch checked={form.active} onChange={(checked) => setForm({ ...form, active: checked })} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label="Link ảnh (URL)">
                            <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={`Sửa Voucher: ${editVoucher?.code}`}
                    open={editOpen}
                    onOk={handleSaveEdit}
                    onCancel={() => setEditOpen(false)}
                    okText="Lưu"
                    cancelText="Hủy"
                    okButtonProps={{ style: { background: '#8b4513', borderColor: '#8b4513' } }}
                    width={600}
                >
                    {editVoucher && (
                        <Form layout="vertical" style={{ marginTop: 24 }}>
                            <Form.Item label="Mã Voucher">
                                <Input value={editVoucher.code} onChange={(e) => setEditVoucher({ ...editVoucher, code: e.target.value })} />
                            </Form.Item>
                            <Form.Item label="Loại">
                                <Select
                                    value={editVoucher.type}
                                    onChange={(v) => setEditVoucher({ ...editVoucher, type: v })}
                                    options={[
                                        { label: 'Giảm theo phần trăm', value: 'PERCENTAGE_DISCOUNT' },
                                        { label: 'Giảm cố định', value: 'FIXED_DISCOUNT' },
                                        { label: 'Mua 1 tặng 1', value: 'BUY_ONE_GET_ONE' },
                                    ]}
                                />
                            </Form.Item>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Giá trị giảm">
                                        <InputNumber
                                            value={editVoucher.discountValue}
                                            onChange={(v) => setEditVoucher({ ...editVoucher, discountValue: Number(v) })}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Đơn tối thiểu">
                                        <InputNumber
                                            value={editVoucher.minOrderAmount}
                                            onChange={(v) => setEditVoucher({ ...editVoucher, minOrderAmount: Number(v) })}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Điểm yêu cầu">
                                        <InputNumber
                                            value={editVoucher.requiredPoints}
                                            onChange={(v) => setEditVoucher({ ...editVoucher, requiredPoints: Number(v) })}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Kích hoạt">
                                        <Switch
                                            checked={editVoucher.active}
                                            onChange={(checked) => setEditVoucher({ ...editVoucher, active: checked })}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label="Link ảnh">
                                <Input value={editVoucher.imageUrl} onChange={(e) => setEditVoucher({ ...editVoucher, imageUrl: e.target.value })} />
                            </Form.Item>
                        </Form>
                    )}
                </Modal>
            </div>
        </div>
    );
}
