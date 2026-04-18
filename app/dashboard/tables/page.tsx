'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Switch, Modal, Form, Input, InputNumber, Tag, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

interface TableData {
    id: number;
    name: string;
    capacity: number;
    available: boolean;
}

export default function TablesPage() {
    const { roles } = useAuth();
    const isAdmin = roles.includes('ROLE_ADMIN');
    const isStaff = roles.includes('ROLE_STAFF');
    const router = useRouter();

    const [tables, setTables] = useState<TableData[]>([]);
    const [showAvailableOnly, setShowAvailableOnly] = useState<boolean>(false);
    const [createOpen, setCreateOpen] = useState<boolean>(false);
    const [form] = Form.useForm<{ name: string; capacity: number; available: boolean }>();

    useEffect(() => {
        const fetchTables = async () => {
            const token = getToken();
            if (!token) return;

            try {
                const response = await fetch(`${API_URL}/api/tables`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setTables(data);
                }
            } catch (error) {
                console.error('Lỗi khi tải danh sách bàn:', error);
            }
        };
        fetchTables();
    }, []);

    const createTable = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const values = await form.validateFields();
            const response = await fetch(`${API_URL}/api/tables`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                const data = await response.json();
                setTables((prev) => [...prev, data]);
                setCreateOpen(false);
                form.resetFields();
                message.success('Tạo bàn mới thành công');
            } else {
                message.error('Lỗi khi tạo bàn mới');
            }
        } catch (error) {
            console.error('Lỗi khi tạo bàn mới:', error);
        }
    };

    const createOrder = async (tableId: number) => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tableId }),
            });

            if (res.ok) {
                const order = await res.json();
                router.push(`/dashboard/orders/${order.id}`);
            } else {
                message.error('Không thể tạo đơn cho bàn này.');
            }
        } catch (error) {
            console.error('Lỗi khi tạo đơn:', error);
            message.error('Không thể tạo đơn cho bàn này.');
        }
    };

    const viewOrderDetails = async (tableId: number) => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/orders/latest-by-table/${tableId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const order = await res.json();
                router.push(`/dashboard/orders/${order.id}`);
            } else {
                message.error('Không tìm thấy đơn hàng cho bàn này.');
            }
        } catch (error) {
            console.error('Không tìm thấy đơn hàng:', error);
            message.error('Không tìm thấy đơn hàng cho bàn này.');
        }
    };

    if (!isAdmin && !isStaff) {
        return <div>Bạn không có quyền truy cập trang này.</div>;
    }

    const displayedTables = showAvailableOnly ? tables.filter((t) => t.available) : tables;

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: 'Tên', dataIndex: 'name', key: 'name' },
        { title: 'Sức chứa', dataIndex: 'capacity', key: 'capacity', width: 120 },
        {
            title: 'Trạng thái',
            key: 'available',
            width: 120,
            render: (_: any, record: TableData) =>
                record.available ? <Tag color="green">Trống</Tag> : <Tag color="orange">Đã đặt</Tag>,
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 220,
            render: (_: any, record: TableData) => (
                <Space>
                    {record.available ? (
                        <Button type="primary" onClick={() => createOrder(record.id)}>
                            Tạo đơn
                        </Button>
                    ) : (
                        <Button onClick={() => viewOrderDetails(record.id)}>Chi tiết đơn</Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Card
            title="Danh sách bàn"
            extra={
                <Space>
                    <span>Chỉ hiển thị bàn trống</span>
                    <Switch checked={showAvailableOnly} onChange={setShowAvailableOnly} />
                    {isAdmin && (
                        <Button type="primary" onClick={() => setCreateOpen(true)}>
                            Tạo bàn mới
                        </Button>
                    )}
                </Space>
            }
        >
            <Table
                rowKey="id"
                dataSource={displayedTables}
                columns={columns as any}
                pagination={{ pageSize: 8, showSizeChanger: false }}
            />

            <Modal
                title="Tạo bàn mới"
                open={createOpen}
                okText="Tạo"
                cancelText="Hủy"
                onOk={createTable}
                onCancel={() => {
                    setCreateOpen(false);
                    form.resetFields();
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ name: '', capacity: 1, available: true }}
                >
                    <Form.Item
                        name="name"
                        label="Tên bàn"
                        rules={[{ required: true, message: 'Vui lòng nhập tên bàn' }]}
                    >
                        <Input placeholder="Nhập tên bàn" />
                    </Form.Item>
                    <Form.Item
                        name="capacity"
                        label="Sức chứa"
                        rules={[{ required: true, type: 'number', min: 1 }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="available" label="Trạng thái" valuePropName="checked">
                        <Switch checkedChildren="Trống" unCheckedChildren="Đã đặt" />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}
