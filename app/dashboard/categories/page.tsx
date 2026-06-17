'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Input, Modal, Popconfirm, Space, Typography, App } from 'antd';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';

export interface Category {
    id: number;
    name: string;
}

export default function CategoryPage() {
    const { message } = App.useApp();
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<Category>({ id: 0, name: '' });
    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await apiGet<Category[]>('/api/categories', {
                headers: { 'Cache-Control': 'no-cache' },
            });
            setCategories(data);
            setSearch('');
        } catch (err) {
            message.error(getErrorMessage(err, 'Lỗi khi tải danh mục. Vui lòng thử lại.'));
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

        setLoading(true);
        try {
            const isCreate = form.id === 0;

            // Only send name field (id should not be sent for create)
            const payload = { name: form.name.trim() };

            if (isCreate) {
                await apiPost('/api/categories', payload, { headers: { 'Cache-Control': 'no-store' } });
            } else {
                await apiPut(`/api/categories/${form.id}`, payload, {
                    headers: { 'Cache-Control': 'no-store' },
                });
            }

            setForm({ id: 0, name: '' });
            setSearch('');
            setModalOpen(false);
            message.success(isCreate ? 'Thêm danh mục thành công' : 'Cập nhật danh mục thành công');
            await fetchCategories();
        } catch (err) {
            message.error(getErrorMessage(err, 'Lỗi khi gửi dữ liệu. Vui lòng thử lại.'));
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
        setLoading(true);
        try {
            await apiDelete(`/api/categories/${id}`, { headers: { 'Cache-Control': 'no-cache' } });

            setForm({ id: 0, name: '' });
            setSearch('');
            message.success('Xóa danh mục thành công');
            await fetchCategories();
        } catch (err) {
            message.error(getErrorMessage(err, 'Lỗi khi xóa danh mục.'));
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
