'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    Table,
    Space,
    Button,
    Popconfirm,
    Tag,
    Pagination,
    Typography,
    DatePicker,
    Select,
    message,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

interface OrderItem {
    id?: number;
    quantity: number;
    menuItem: {
        id?: number;
        name: string;
        price?: number;
        imageUrl?: string;
        category?: { name: string };
    };
}

interface Order {
    id?: number;
    orderTime: string;
    status: string;
    orderType: string;
    table?: { id?: number; name: string; available?: boolean; capacity?: number };
    staff: { id?: number; displayName: string; username?: string };
    orderItems: OrderItem[];
}

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    number: number;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [tableId, setTableId] = useState<number | ''>('');
    const [availableTables, setAvailableTables] = useState<
        Array<{ id: number; name: string; capacity: number }>
    >([]);
    const [totalPages, setTotalPages] = useState(0);
    const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const router = useRouter();

    const fetchOrders = async () => {
        const token = getToken();
        if (!token) return;

        const url = (() => {
            if (isFiltering && range && range[0] && range[1]) {
                const start = range[0].format('YYYY-MM-DD');
                const end = range[1].format('YYYY-MM-DD');
                return `${API_URL}/api/orders/filter?start=${start}&end=${end}&page=${page}&size=${size}&sortBy=orderTime&sortDir=desc`;
            }
            return `${API_URL}/api/orders?page=${page}&size=${size}`;
        })();

        try {
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data: PageResponse<Order> = await res.json();
                setOrders(data.content);
                setTotalPages(data.totalPages);
            } else {
                console.error('Failed to load orders');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAvailableTables = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`${API_URL}/api/tables/available`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const mapped = (data || []).map((t: any) => ({
                id: t.id,
                name: t.name,
                capacity: t.capacity,
            }));
            setAvailableTables(mapped);
        } catch (e) {
            console.error('Failed to load available tables', e);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchAvailableTables();
    }, [
        page,
        isFiltering,
        JSON.stringify(range && [range[0]?.format?.('YYYY-MM-DD'), range[1]?.format?.('YYYY-MM-DD')]),
    ]);

    const createOrder = async () => {
        if (tableId === '') return;
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
                setTableId('');
                await fetchOrders();
                await fetchAvailableTables();
                message.success('Tạo đơn thành công');
            } else {
                const text = await res.text();
                message.error(text || 'Unable to create order');
            }
        } catch (e) {
            console.error(e);
            message.error('Unable to create order');
        }
    };

    const createTakeaway = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/orders/takeaway`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchOrders();
                message.success('Tạo đơn mang về thành công');
            } else {
                message.error('Unable to create takeaway');
            }
        } catch (e) {
            console.error(e);
            message.error('Unable to create takeaway');
        }
    };

    const serveOrder = async (id?: number) => {
        if (id == null) return;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/orders/${id}/serve`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchOrders();
                message.success('Đã phục vụ đơn hàng');
            } else {
                message.error('Unable to serve order');
            }
        } catch (e) {
            console.error(e);
            message.error('Unable to serve order');
        }
    };

    const deleteOrder = async (id?: number) => {
        if (id == null) return;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/orders/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchOrders();
                message.success('Đã xóa đơn hàng');
            } else {
                message.error('Unable to delete order');
            }
        } catch (e) {
            console.error(e);
            message.error('Unable to delete order');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'Time',
            dataIndex: 'orderTime',
            key: 'orderTime',
            render: (v: string) => new Date(v).toLocaleString(),
        },
        { title: 'Type', dataIndex: 'orderType', key: 'orderType' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => {
                let color = 'orange';
                if (s === 'PENDING') color = 'green';
                else if (s === 'PAID') color = 'blue';
                return <Tag color={color}>{s}</Tag>;
            },
        },
        { title: 'Table', key: 'table', render: (_: any, r: Order) => r.table?.name || '-' },
        { title: 'Staff', key: 'staff', render: (_: any, r: Order) => r.staff.displayName },
        {
            title: 'Details',
            key: 'details',
            render: (_: any, r: Order) =>
                r.id != null ? (
                    <Button
                        size="small"
                        style={{
                            backgroundColor: '#18b87dff',
                            color: '#fff',
                            border: 'none',
                            transition: 'transform .15s ease, filter .15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.filter = 'brightness(0.95)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.filter = '';
                            e.currentTarget.style.transform = '';
                        }}
                        onClick={() => {
                            router.push(`/dashboard/orders/${r.id}`);
                        }}
                    >
                        View Items
                    </Button>
                ) : (
                    '-'
                ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, r: Order) => (
                <Space>
                    <Popconfirm title="Serve order?" onConfirm={() => serveOrder(r.id)}>
                        <Button type="primary" size="small">
                            Serve
                        </Button>
                    </Popconfirm>
                    <Popconfirm
                        title="Delete order?"
                        onConfirm={() => deleteOrder(r.id)}
                        okButtonProps={{ danger: true }}
                        okText="Delete"
                    >
                        <Button danger size="small">
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card
            title={
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Orders
                </Typography.Title>
            }
            extra={
                <Space>
                    <Select
                        placeholder="Chọn bàn trống"
                        style={{ minWidth: 180 }}
                        value={tableId === '' ? undefined : tableId}
                        onChange={(val) => setTableId(val)}
                        allowClear
                        onClear={() => setTableId('')}
                        options={availableTables.map((t) => ({
                            label: `${t.name} (x${t.capacity})`,
                            value: t.id,
                        }))}
                    />
                    <Button type="primary" onClick={createOrder}>
                        New Dine-In
                    </Button>
                    <Button onClick={createTakeaway}>New Takeaway</Button>
                    <DatePicker.RangePicker
                        value={range as any}
                        onChange={(vals) => setRange(vals as any)}
                        allowClear
                    />
                    <Button
                        onClick={() => {
                            setPage(0);
                            setIsFiltering(true);
                            fetchOrders();
                        }}
                    >
                        Lọc
                    </Button>
                    <Button
                        onClick={() => {
                            setRange(null);
                            setIsFiltering(false);
                            setPage(0);
                            fetchOrders();
                        }}
                    >
                        Reset
                    </Button>
                </Space>
            }
        >
            <Table
                rowKey={(r) => String(r.id ?? Math.random())}
                dataSource={orders}
                columns={columns.map((col) => ({
                    ...col,
                    render: (v: any, r: Order) => (col.render ? col.render(v, r) : v),
                }))}
                pagination={false}
            />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <Pagination
                    current={page + 1}
                    total={totalPages * size}
                    onChange={(p) => setPage(p - 1)}
                    showSizeChanger={false}
                />
            </div>
        </Card>
    );
}
