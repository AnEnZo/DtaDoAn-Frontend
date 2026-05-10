'use client';

import React from 'react';
import { Card, Button, Space, Tag } from 'antd';
import {
    ClockCircleOutlined,
    TableOutlined,
    UserOutlined,
    PlusOutlined,
} from '@ant-design/icons';

export interface OrderItem {
    id?: number;
    quantity: number;
    menuItem: {
        id?: number;
        name: string;
        price?: number;
        imageUrl?: string;
    };
}

export interface OrderDetail {
    id?: number;
    orderTime: string;
    status: string;
    orderType: string;
    table?: { id?: number; name: string };
    staff: { id?: number; displayName: string };
    orderItems: OrderItem[];
}

interface OrderInfoCardProps {
    order: OrderDetail;
    orderId: string;
    onServe: () => void;
    onAddMenu: () => void;
}

const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order, orderId, onServe, onAddMenu }) => {
    return (
        <Card
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span>Chi tiết đơn hàng #{orderId}</span>
                    <Space>
                        {order.status === 'PENDING' && (
                            <Button type="primary" onClick={onServe}>
                                Serve
                            </Button>
                        )}
                        {(order.status === 'SERVED' || order.status === 'PENDING') && (
                            <Button icon={<PlusOutlined />} type="primary" onClick={onAddMenu}>
                                Add Menu Item
                            </Button>
                        )}
                    </Space>
                </div>
            }
        >
            {/* Order metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div>
                    <div className="text-gray-500 mb-1">Thời gian</div>
                    <div className="font-medium">
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        {new Date(order.orderTime).toLocaleString('vi-VN')}
                    </div>
                </div>
                <div>
                    <div className="text-gray-500 mb-1">Trạng thái</div>
                    <div>
                        <Tag color={order.status === 'SERVED' ? 'green' : 'blue'}>{order.status}</Tag>
                    </div>
                </div>
                <div>
                    <div className="text-gray-500 mb-1">Loại đơn</div>
                    <div className="font-medium">{order.orderType}</div>
                </div>
                {order.table && (
                    <div>
                        <div className="text-gray-500 mb-1">Bàn</div>
                        <div className="font-medium">
                            <TableOutlined style={{ marginRight: 8 }} />
                            {order.table.name}
                        </div>
                    </div>
                )}
                <div>
                    <div className="text-gray-500 mb-1">Nhân viên</div>
                    <div className="font-medium">
                        <UserOutlined style={{ marginRight: 8 }} />
                        {order.staff?.displayName}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default OrderInfoCard;
