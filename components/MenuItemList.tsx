'use client';

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, InputNumber, Button, Pagination, Empty } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Image from 'next/image';
import { API_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';

export interface MenuItem {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
}

interface Props {
    categoryName: string;
    categoryId?: number; // Added categoryId
    orderId?: string;
    onChange?: () => void;
    searchTerm?: string;
}

const ITEMS_PER_PAGE = 6;

// Skeleton Loading Component
const SkeletonCard = () => (
    <Card className="menu-skeleton-card" variant="borderless">
        <div className="menu-skeleton-image" />
        <div className="menu-skeleton-text" style={{ width: '80%' }} />
        <div className="menu-skeleton-text" style={{ width: '60%' }} />
        <div className="menu-skeleton-text" style={{ width: '40%' }} />
    </Card>
);

const MenuItemList: React.FC<Props> = ({ categoryName, categoryId, orderId, onChange, searchTerm }) => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [page, setPage] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const { roles } = useAuth();
    const isUser = roles.length === 1 && roles.includes('ROLE_USER');

    useEffect(() => {
        // if (!categoryName) return; // Removed check to allow initial load if logic changes

        const fetchItems = async () => {
            setLoading(true);
            try {
                const { getToken } = await import('@/lib/auth/auth-utils');
                const token = getToken();
                const headers: HeadersInit = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                // Use categoryId if available, fallback to legacy name check or "all"
                let url = `${API_URL}/api/menu-items`;

                if (categoryId !== undefined && categoryId !== -1) {
                    url = `${API_URL}/api/menu-items/category/id/${categoryId}`;
                } else if (categoryName && categoryName !== 'Tất cả' && categoryId === undefined) {
                    // Fallback for legacy usage if categoryId is not provided
                    url = `${API_URL}/api/menu-items/category/${categoryName}`;
                }

                const res = await fetch(url, { headers });
                const data = await res.json();

                setItems(data);
                const initial: Record<number, number> = {};
                data.forEach((it: MenuItem) => {
                    initial[it.id] = 1;
                });
                setQuantities(initial);
                setPage(0);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchItems();
    }, [categoryName, categoryId]);

    const handleQtyChange = (id: number, value: number) => {
        setQuantities((prev) => ({ ...prev, [id]: value }));
    };

    const addItem = async (id: number) => {
        if (!orderId || !onChange) return;
        const qty = quantities[id] || 1;
        const url = `${API_URL}/api/orders/${orderId}/items?menuItemId=${id}&quantity=${qty}`;

        try {
            const { getToken } = await import('@/lib/auth/auth-utils');
            const token = getToken();

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error();
            await res.json();
            onChange();
        } catch (error) {
            console.error(error);
        }
    };

    const removeItem = async (id: number) => {
        if (!orderId || !onChange) return;
        const qty = quantities[id] || 1;
        const url = `${API_URL}/api/orders/${orderId}/items?menuItemId=${id}&quantity=${qty}`;

        try {
            const { getToken } = await import('@/lib/auth/auth-utils');
            const token = getToken();

            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status !== 204) await res.json();
            onChange();
        } catch (error) {
            console.error(error);
        }
    };

    // Filter items by search term
    const filteredItems = searchTerm
        ? items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : items;

    const pageCount = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const pagedItems = filteredItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    const onPaginationChange = (p: number) => {
        setPage(p - 1);
    };

    if (loading) {
        return (
            <Row gutter={[16, 16]}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Col key={i} xs={24} sm={12} md={8}>
                        <SkeletonCard />
                    </Col>
                ))}
            </Row>
        );
    }

    if (filteredItems.length === 0) {
        return (
            <Empty
                description={
                    searchTerm
                        ? `Không tìm thấy món nào với "${searchTerm}"`
                        : 'Không có món nào trong danh mục này'
                }
                style={{ padding: '60px 0' }}
            />
        );
    }

    return (
        <div>
            <Row gutter={[16, 16]}>
                {pagedItems.map((item) => (
                    <Col key={item.id} xs={24} sm={12} lg={8}>
                        <Card className="menu-item-card" variant="borderless">
                            <div className="menu-item-image-wrapper" style={{ cursor: 'pointer' }}>
                                <Link href={`/menu/${item.id}`}>
                                    <Image
                                        src={item.imageUrl || '/placeholder.png'}
                                        alt={item.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="menu-item-image"
                                    />
                                    <div className="price-badge">{item.price.toLocaleString()}₫</div>
                                    <div className="menu-item-overlay">
                                        <Typography.Text style={{ color: '#fff', fontWeight: 700 }}>
                                            {item.name}
                                        </Typography.Text>
                                    </div>
                                </Link>
                            </div>

                            <div className="menu-item-content">
                                <div className="menu-item-name">
                                    <Link href={`/menu/${item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                        {item.name}
                                    </Link>
                                </div>

                                {!isUser && orderId && onChange && (
                                    <>
                                        <div className="quantity-controls">
                                            <span style={{ fontWeight: 600 }}>Số lượng:</span>
                                            <InputNumber
                                                className="quantity-input"
                                                min={1}
                                                value={quantities[item.id]}
                                                onChange={(val) => handleQtyChange(item.id, Math.max(1, Number(val || 1)))}
                                                size="middle"
                                            />
                                        </div>

                                        <div className="menu-item-actions">
                                            <Button
                                                className="add-item-btn"
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={() => addItem(item.id)}
                                            >
                                                Thêm
                                            </Button>
                                            <Button
                                                className="remove-item-btn"
                                                danger
                                                icon={<MinusOutlined />}
                                                onClick={() => removeItem(item.id)}
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {pageCount > 1 && (
                <div className="menu-pagination">
                    <Pagination
                        current={page + 1}
                        total={filteredItems.length}
                        pageSize={ITEMS_PER_PAGE}
                        onChange={onPaginationChange}
                        showSizeChanger={false}
                    />
                </div>
            )}
        </div>
    );
};

export default MenuItemList;
