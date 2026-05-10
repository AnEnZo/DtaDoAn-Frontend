'use client';

import React, { useState, useCallback } from 'react';
import { Input, Row, Col } from 'antd';
import Link from 'next/link';
import { HomeOutlined, AppstoreOutlined, SearchOutlined } from '@ant-design/icons';
import CategoryList, { Category } from '@/components/CategoryList';
import MenuItemList from '@/components/MenuItemList';
import { useAuth } from '@/lib/hooks/useAuth';

export default function MenuPage() {
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const { user } = useAuth();

    const displayName = user?.displayName || user?.sub || 'Khách';

    const handleCategorySelect = useCallback((cat: Category) => {
        setSelectedCategory(cat);
        setSearchTerm('');
    }, []);

    return (
        <div className="menu-page">
            {/* Header with Back to Home button */}
            <div className="menu-header">
                <h1>The Coffee House</h1>
                <div className="menu-header-actions">
                    {user && (
                        <div className="user-info-badge">
                            Xin chào, <strong>{String(displayName)}</strong>
                        </div>
                    )}
                    <Link href="/home" className="back-to-home-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <HomeOutlined /> Về Trang Chủ
                    </Link>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                {/* Category Sidebar */}
                <Col xs={24} md={8} lg={6}>
                    <div className="category-sidebar">
                        <div className="category-sidebar-title">
                            <AppstoreOutlined />
                            Danh Mục
                        </div>
                        <CategoryList onSelect={handleCategorySelect} />
                    </div>
                </Col>

                {/* Menu Items Section */}
                <Col xs={24} md={16} lg={18}>
                    <div className="menu-items-section">
                        {selectedCategory ? (
                            <>
                                <div className="menu-section-header">
                                    <h2 className="menu-section-title">{selectedCategory.name}</h2>
                                    <div className="menu-search-bar">
                                        <Input
                                            prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                            placeholder="Tìm kiếm món ăn..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            allowClear
                                            size="large"
                                        />
                                    </div>
                                </div>
                                <MenuItemList categoryName={selectedCategory.name} categoryId={selectedCategory.id} searchTerm={searchTerm} />
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">🍽️</div>
                                <div className="empty-state-title">Chọn Danh Mục</div>
                                <div className="empty-state-text">
                                    Vui lòng chọn một danh mục bên trái để xem thực đơn
                                </div>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </div>
    );
}
