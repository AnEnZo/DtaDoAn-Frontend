'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Input, Space, Typography, App, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { apiGet } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';
import { getToken } from '@/lib/auth/auth-utils';

interface FoodSuggestion {
    id: number;
    foodName: string;
    description: string | null;
    category: string | null;
    votes: number;
    createdAt: string;
    userEmail: string | null;
}

export default function FoodSuggestionsPage() {
    const { message } = App.useApp();
    const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState<FoodSuggestion[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = async () => {
        const token = getToken();
        if (!token) {
            message.error('Bạn chưa đăng nhập.');
            return;
        }

        setLoading(true);
        try {
            const data = await apiGet<FoodSuggestion[]>(`/api/food-suggestions`, {
                headers: { 'Cache-Control': 'no-cache' },
            });
            setSuggestions(data);
            setSearch('');
        } catch (err) {
            message.error(getErrorMessage(err, 'Lỗi khi tải gợi ý món ăn. Vui lòng thử lại.'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    useEffect(() => {
        const keyword = search.toLowerCase();
        const filtered = keyword
            ? suggestions.filter((s) => s.foodName.toLowerCase().includes(keyword))
            : suggestions;
        setFilteredSuggestions(filtered);
    }, [suggestions, search]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const getVoteTag = (votes: number) => {
        if (votes >= 50) {
            return <Tag color="green">{votes} votes</Tag>;
        } else if (votes >= 20) {
            return <Tag color="blue">{votes} votes</Tag>;
        } else if (votes >= 10) {
            return <Tag color="orange">{votes} votes</Tag>;
        } else {
            return <Tag>{votes} votes</Tag>;
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'Tên món ăn',
            dataIndex: 'foodName',
            key: 'foodName',
            width: 200,
            render: (text: string) => <strong>{text}</strong>
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: 250,
            render: (text: string | null) => text || <span style={{ color: '#999' }}>—</span>
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (text: string | null) => text || <span style={{ color: '#999' }}>—</span>
        },
        {
            title: 'Số vote',
            dataIndex: 'votes',
            key: 'votes',
            width: 120,
            sorter: (a: FoodSuggestion, b: FoodSuggestion) => b.votes - a.votes,
            defaultSortOrder: 'ascend' as const,
            render: (votes: number) => getVoteTag(votes)
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (date: string) => new Date(date).toLocaleString('vi-VN')
        },
        {
            title: 'Người gợi ý',
            dataIndex: 'userEmail',
            key: 'userEmail',
            width: 200,
            render: (email: string | null) => email || <span style={{ color: '#999' }}>Anonymous</span>
        },
    ];

    return (
        <Card
            title={
                <Space direction="vertical" size={0}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        Quản lý Gợi ý Món ăn
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Xem gợi ý món ăn từ khách hàng
                    </Typography.Text>
                </Space>
            }
            extra={
                <Space>
                    <Input
                        placeholder="Tìm kiếm món ăn..."
                        allowClear
                        onChange={handleSearch}
                        value={search}
                        style={{ width: 260 }}
                    />
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchSuggestions}
                        disabled={loading}
                    >
                        Làm mới
                    </Button>
                </Space>
            }
            variant="outlined"
        >
            <Table
                rowKey="id"
                loading={loading}
                columns={columns as any}
                dataSource={filteredSuggestions}
                pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
                locale={{ emptyText: 'Chưa có gợi ý nào.' }}
                scroll={{ x: 1200 }}
            />
        </Card>
    );
}
