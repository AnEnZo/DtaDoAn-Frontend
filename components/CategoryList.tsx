'use client';

import React, { useEffect, useState } from 'react';
import { List, Typography, Spin, message } from 'antd';
import { AppstoreOutlined, CoffeeOutlined, GiftOutlined, StarOutlined } from '@ant-design/icons';
import { apiGet } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';

export interface Category {
    id: number;
    name: string;
}

interface Props {
    onSelect: (cat: Category) => void;
}

// Icon mapping for categories
const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('tất cả')) return <AppstoreOutlined />;
    if (lowerName.includes('cà phê') || lowerName.includes('coffee')) return <CoffeeOutlined />;
    if (lowerName.includes('món chính') || lowerName.includes('main')) return <StarOutlined />;
    return <GiftOutlined />;
};

const CategoryList: React.FC<Props> = ({ onSelect }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await apiGet<Category[]>('/api/categories');

                const allOption: Category = { id: -1, name: 'Tất cả' };
                const list = [allOption, ...data];
                setCategories(list);
                setSelectedId(allOption.id);
                onSelect(allOption);
                setLoading(false);
            } catch (err) {
                console.error(err);
                message.error(getErrorMessage(err, 'Không thể tải danh mục.'));
                setLoading(false);
            }
        };

        fetchCategories();
    }, [onSelect]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <List
            dataSource={categories}
            renderItem={(cat) => {
                const isSelected = selectedId === cat.id;
                return (
                    <List.Item
                        className={`category-item${isSelected ? ' selected' : ''}`}
                        onClick={() => {
                            setSelectedId(cat.id);
                            onSelect(cat);
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                            <span style={{ fontSize: '1.2rem' }}>{getCategoryIcon(cat.name)}</span>
                            <Typography.Text strong={isSelected} style={{ flex: 1 }}>
                                {cat.name}
                            </Typography.Text>
                            {isSelected && <span>✓</span>}
                        </div>
                    </List.Item>
                );
            }}
            style={{}}
        />
    );
};

export default CategoryList;
