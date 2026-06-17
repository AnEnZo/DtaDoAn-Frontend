'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Switch, Modal, Form, Input, InputNumber, Tag, App, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';

interface TableData {
    id: number;
    name: string;
    capacity: number;
    available: boolean;
}

export default function TablesPage() {
    const { message } = App.useApp();
    const { roles } = useAuth();
    const isAdmin = roles.includes('ROLE_ADMIN');
    const isStaff = roles.includes('ROLE_STAFF');
    const router = useRouter();

    const [tables, setTables] = useState<TableData[]>([]);
    const [showAvailableOnly, setShowAvailableOnly] = useState<boolean>(false);
    const [createOpen, setCreateOpen] = useState<boolean>(false);
    const [form] = Form.useForm<{ name: string; capacity: number }>();

    const [editOpen, setEditOpen] = useState<boolean>(false);
    const [editingTable, setEditingTable] = useState<TableData | null>(null);
    const [editForm] = Form.useForm<{ name: string; capacity: number }>();

    const fetchTables = async () => {
        try {
            const data = await apiGet<TableData[]>('/api/tables');
            setTables(data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách bàn:', error);
            message.error(getErrorMessage(error, 'Lỗi khi tải danh sách bàn'));
        }
    };

    useEffect(() => {
        fetchTables();

        // Refetch khi user quay lại trang (navigate back / switch tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchTables();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const createTable = async () => {
        const values = await form.validateFields();

        try {
            const data = await apiPost<TableData>('/api/tables', values);
            setTables((prev) => [...prev, data]);
            setCreateOpen(false);
            form.resetFields();
            message.success('Tạo bàn mới thành công');
        } catch (error) {
            console.error('Lỗi khi tạo bàn mới:', error);
            message.error(getErrorMessage(error, 'Lỗi khi tạo bàn mới'));
        }
    };

    const openEdit = (record: TableData) => {
        setEditingTable(record);
        editForm.setFieldsValue({ name: record.name, capacity: record.capacity });
        setEditOpen(true);
    };

    const updateTable = async () => {
        if (!editingTable) return;
        const values = await editForm.validateFields();
        try {
            const updated = await apiPut<TableData>(`/api/tables/${editingTable.id}`, {
                ...values,
                available: editingTable.available, // giữ nguyên trạng thái hiện tại (DTO yêu cầu)
            });
            setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setEditOpen(false);
            setEditingTable(null);
            editForm.resetFields();
            message.success('Cập nhật bàn thành công');
        } catch (error) {
            message.error(getErrorMessage(error, 'Lỗi khi cập nhật bàn'));
        }
    };

    const deleteTable = async (id: number) => {
        try {
            await apiDelete(`/api/tables/${id}`);
            setTables((prev) => prev.filter((t) => t.id !== id));
            message.success('Đã xóa bàn');
        } catch (error) {
            message.error(getErrorMessage(error, 'Không thể xóa bàn'));
        }
    };

    const createOrder = async (tableId: number) => {
        try {
            const order = await apiPost<{ id: number }>('/api/orders', { tableId });
            router.push(`/dashboard/orders/${order.id}`);
        } catch (error) {
            console.error('Lỗi khi tạo đơn:', error);
            message.error(getErrorMessage(error, 'Không thể tạo đơn cho bàn này.'));
        }
    };

    const viewOrderDetails = async (tableId: number) => {
        try {
            const order = await apiGet<{ id: number }>(`/api/orders/latest-by-table/${tableId}`);
            router.push(`/dashboard/orders/${order.id}`);
        } catch (error) {
            console.error('Không tìm thấy đơn hàng:', error);
            message.error(getErrorMessage(error, 'Không tìm thấy đơn hàng cho bàn này.'));
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
            width: 360,
            render: (_: any, record: TableData) => (
                <Space>
                    {record.available ? (
                        <Button type="primary" onClick={() => createOrder(record.id)}>
                            Tạo đơn
                        </Button>
                    ) : (
                        <Button onClick={() => viewOrderDetails(record.id)}>Chi tiết đơn</Button>
                    )}
                    {isAdmin && (
                        <>
                            <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>
                                Sửa
                            </Button>
                            <Popconfirm
                                title="Xóa bàn này?"
                                description="Bàn sẽ được ẩn khỏi danh sách (xóa mềm)."
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => deleteTable(record.id)}
                            >
                                <Button danger icon={<DeleteOutlined />}>
                                    Xóa
                                </Button>
                            </Popconfirm>
                        </>
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
                    initialValues={{ name: '', capacity: 1 }}
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
                    {/* Bàn luôn được tạo ở trạng thái "Trống" — không cần chọn trạng thái */}
                </Form>
            </Modal>

            <Modal
                title="Sửa thông tin bàn"
                open={editOpen}
                okText="Lưu"
                cancelText="Hủy"
                onOk={updateTable}
                onCancel={() => {
                    setEditOpen(false);
                    setEditingTable(null);
                    editForm.resetFields();
                }}
            >
                <Form form={editForm} layout="vertical">
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
                </Form>
            </Modal>
        </Card>
    );
}
