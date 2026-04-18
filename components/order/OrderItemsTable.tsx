'use client';

import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, message, InputNumber } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { OrderItem } from './OrderInfoCard';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

interface OrderItemsTableProps {
    items: OrderItem[];
    total: number;
    orderId?: string;
    onUpdate?: () => void;
}

const EditableQuantity = ({ quantity, onUpdate, disabled }: { quantity: number; onUpdate: (delta: number) => void; disabled?: boolean }) => {
    const [val, setVal] = useState(quantity);

    useEffect(() => {
        setVal(quantity);
    }, [quantity]);

    const handleBlur = () => {
        const delta = (val || 1) - quantity;
        if (delta !== 0) {
            onUpdate(delta);
        }
    };

    return (
        <InputNumber
            min={1}
            value={val}
            onChange={(v) => setVal(v || 1)}
            onBlur={handleBlur}
            onPressEnter={handleBlur}
            size="small"
            style={{ width: 60, textAlign: 'center' }}
            controls={false}
            disabled={disabled}
        />
    );
};

const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ items, total, orderId, onUpdate }) => {
    const handleUpdateQuantity = (itemId: number, delta: number) => {
        if (!orderId || !onUpdate || delta === 0) return;

        const action = delta > 0 ? 'add' : 'remove';
        const absQty = Math.abs(delta);
        const token = getToken();
        if (!token) return;

        const url = `${API_URL}/api/orders/${orderId}/items?menuItemId=${itemId}&quantity=${absQty}`;

        fetch(url, {
            method: action === 'add' ? 'POST' : 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text);
                }
                // If DELETE returns 204, it might not have JSON
                if (res.status !== 204) {
                    return res.json();
                }
            })
            .then(() => {
                onUpdate();
                message.success(action === 'add' ? 'Đã thêm món' : 'Đã giảm số lượng');
            })
            .catch((err) => {
                console.error(err);
                message.error('Không thể cập nhật số lượng');
            });
    };

    const columns: any[] = [
        {
            title: 'Tên món',
            dataIndex: ['menuItem', 'name'],
            key: 'name',
            render: (text: string) => <strong>{text || <span style={{ color: 'red' }}>Món đã bị xoá</span>}</strong>,
        },
        {
            title: 'Đơn giá',
            dataIndex: ['menuItem', 'price'],
            key: 'price',
            render: (_: any, it: OrderItem) => (it.menuItem?.price || 0).toLocaleString(),
        },
        {
            title: 'SL',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (qty: number, record: OrderItem) => (
                <Space>
                    <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => record.menuItem?.id && handleUpdateQuantity(record.menuItem.id, -1)}
                        disabled={!record.menuItem?.id}
                    />
                    <EditableQuantity
                        quantity={qty}
                        onUpdate={(delta) => record.menuItem?.id && handleUpdateQuantity(record.menuItem.id, delta)}
                        disabled={!record.menuItem?.id}
                    />
                    <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => record.menuItem?.id && handleUpdateQuantity(record.menuItem.id, 1)}
                        disabled={!record.menuItem?.id}
                    />
                </Space>
            ),
        },
        {
            title: 'Thành tiền',
            key: 'total',
            render: (_: any, it: OrderItem) => ((it.menuItem?.price || 0) * it.quantity).toLocaleString(),
        },
    ];

    return (
        <Card style={{ marginTop: 24 }}>
            <Table
                dataSource={items}
                columns={columns}
                pagination={false}
                size="middle"
                rowKey={(r) => r.id || Math.random()}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                            <strong>Tổng cộng</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                            <strong>{total.toLocaleString()}</strong>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </Card>
    );
};

export default OrderItemsTable;
