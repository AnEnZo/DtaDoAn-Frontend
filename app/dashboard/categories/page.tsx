'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Input, Modal, Popconfirm, Space, Typography, message } from 'antd';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

export interface Category {
    id: number;
    name: string;
}

export default function CategoryPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<Category>({ id: 0, name: '' });
    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchCategories = async () => {
        const token = getToken();
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/categories`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                throw new Error('Không thể lấy danh sách danh mục');
            }

            const data: Category[] = await response.json();
            setCategories(data);
            setSearch('');
        } catch (err) {
            message.error('Lỗi khi tải danh mục. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const keyword = search.toLowerCase();
        const filtered = keyword
            ? categories.filter((c) => c.name.toLowerCase().includes(keyword))
            : categories;
        setFilteredCategories(filtered);
    }, [categories, search]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (form.name.trim() === '') {
            message.error('Tên danh mục không được để trống.');
            return;
        }

        const token = getToken();
        if (!token) {
            message.error('Bạn chưa đăng nhập.');
            return;
        }

        setLoading(true);
        try {
            const isCreate = form.id === 0;
            const method = isCreate ? 'POST' : 'PUT';
            const url = isCreate
                ? `${API_URL}/api/categories`
                : `${API_URL}/api/categories/${form.id}`;

            // Only send name field (id should not be sent for create)
            const payload = isCreate
                ? { name: form.name.trim() }
                : { name: form.name.trim() };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Cache-Control': 'no-store',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || errorData.error || 'Thao tác thất bại';
                throw new Error(errorMessage);
            }

            setForm({ id: 0, name: '' });
            setSearch('');
            setModalOpen(false);
            message.success(isCreate ? 'Thêm danh mục thành công' : 'Cập nhật danh mục thành công');
            await fetchCategories();
        } catch (err: any) {
            message.error(err.message || 'Lỗi khi gửi dữ liệu. Vui lòng thử lại.');
            console.error('Category error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (cat: Category) => {
        setForm(cat);
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const token = getToken();
        if (!token) {
            message.error('Bạn chưa đăng nhập.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                throw new Error('Không thể xóa danh mục');
            }

            setForm({ id: 0, name: '' });
            setSearch('');
            message.success('Xóa danh mục thành công');
            await fetchCategories();
        } catch (err) {
            message.error('Lỗi khi xóa danh mục.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
        { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
        {
            title: 'Hành động',
            key: 'actions',
            width: 180,
            render: (_: any, record: Category) => (
                <Space>
                    <Button onClick={() => handleEdit(record)}>Sửa</Button>
                    <Popconfirm
                        title="Xóa danh mục"
                        description={`Bạn có chắc muốn xóa "${record.name}"?`}
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button danger>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card
            title={
                <Space direction="vertical" size={0}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        Quản lý Danh mục
                    </Typography.Title>
                    <Typography.Text type="secondary">Tạo, sửa, xóa danh mục sản phẩm</Typography.Text>
                </Space>
            }
            extra={
                <Space>
                    <Input
                        placeholder="Tìm kiếm danh mục..."
                        allowClear
                        onChange={handleSearch}
                        value={search}
                        style={{ width: 260 }}
                    />
                    <Button
                        type="primary"
                        onClick={() => {
                            setModalOpen(true);
                            setForm({ id: 0, name: '' });
                        }}
                        disabled={loading}
                    >
                        Thêm danh mục
                    </Button>
                </Space>
            }
            variant="outlined"
        >
            <Table
                rowKey="id"
                loading={loading}
                columns={columns as any}
                dataSource={filteredCategories}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                locale={{ emptyText: 'Không có danh mục nào.' }}
            />

            <Modal
                title={form.id === 0 ? 'Thêm danh mục' : 'Cập nhật danh mục'}
                open={modalOpen}
                okText={form.id === 0 ? 'Thêm' : 'Cập nhật'}
                cancelText="Hủy"
                onOk={handleSubmit}
                confirmLoading={loading}
                onCancel={() => {
                    setModalOpen(false);
                    setForm({ id: 0, name: '' });
                }}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                        name="name"
                        placeholder="Tên danh mục"
                        value={form.name}
                        onChange={handleChange}
                        maxLength={100}
                    />
                </Space>
            </Modal>
        </Card>
    );
}
