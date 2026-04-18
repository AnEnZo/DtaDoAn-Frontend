'use client';

import React, { useEffect, useState } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Typography,
    Popconfirm,
    message,
} from 'antd';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

interface CategoryDTO {
    id?: number;
    name: string;
}

interface MenuItemDTO {
    id?: number;
    name: string;
    price: number;
    imageUrl: string;
    category: CategoryDTO;
    description?: string;
}

export default function FoodPage() {
    const { roles } = useAuth();
    const isAdmin = roles.includes('ROLE_ADMIN');
    const isStaff = roles.includes('ROLE_STAFF');

    const [danhSachMon, setDanhSachMon] = useState<MenuItemDTO[]>([]);
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

    const [newFood, setNewFood] = useState<MenuItemDTO>({
        name: '',
        price: 0,
        imageUrl: '',
        category: { name: '' },
        description: '',
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editFood, setEditFood] = useState<MenuItemDTO>({
        name: '',
        price: 0,
        imageUrl: '',
        category: { id: 0, name: '' },
        description: '',
    });

    useEffect(() => {
        const fetchAll = async () => {
            const token = getToken();
            if (!token) return;

            try {
                const res = await fetch(`${API_URL}/api/categories`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const catData: CategoryDTO[] = await res.json();
                setCategories(catData);
                await fetchFoods(catData);
            } catch (err) {
                console.error('Lỗi khi load:', err);
            }
        };

        fetchAll();
    }, []);

    const fetchFoods = async (loadedCategories: CategoryDTO[]) => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/menu-items`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data: any[] = await res.json();

            const foodsWithCategory = data.map((food) => {
                const categoryId = food.category?.id;
                const matched = loadedCategories.find((cat) => cat.id === categoryId);

                return {
                    id: food.id,
                    name: food.name,
                    price: food.price,
                    imageUrl: food.imageUrl,
                    description: food.description,
                    category: matched ?? { id: categoryId ?? 0, name: 'Không rõ' },
                };
            });

            setDanhSachMon(foodsWithCategory);
        } catch (err) {
            console.error('Lỗi khi lấy món ăn:', err);
        }
    };

    const createFood = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/menu-items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newFood),
            });

            if (!res.ok) throw new Error('Failed to create food');

            const data = await res.json();
            setDanhSachMon((prev) => [...prev, data]);
            setNewFood({ name: '', price: 0, imageUrl: '', category: { name: '' } });
            setShowCreateForm(false);
            message.success('Thêm món ăn thành công');
        } catch (err) {
            console.error('Lỗi khi tạo món ăn:', err);
            message.error('Lỗi khi tạo món ăn');
        }
    };

    const deleteFood = async (id: number) => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/menu-items/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to delete food');

            setDanhSachMon((prev) => prev.filter((m) => m.id !== id));
            message.success('Xóa món ăn thành công');
        } catch (err) {
            console.error('Lỗi khi xóa món ăn:', err);
            message.error('Lỗi khi xóa món ăn');
        }
    };

    const updateFood = async () => {
        if (!editingId) return;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/menu-items/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editFood),
            });

            if (!res.ok) throw new Error('Failed to update food');

            const data = await res.json();
            setDanhSachMon((prev) => prev.map((m) => (m.id === editingId ? data : m)));
            setEditingId(null);
            setEditFood({ name: '', price: 0, imageUrl: '', category: { id: 0, name: '' } });
            message.success('Cập nhật món ăn thành công');
        } catch (err) {
            console.error('Lỗi khi cập nhật món ăn:', err);
            message.error('Lỗi khi cập nhật món ăn');
        }
    };

    const handleCategoryChange = (name: string, isEdit = false) => {
        const selected = categories.find((c) => c.name === name);
        if (!selected) return;
        if (isEdit) {
            setEditFood({ ...editFood, category: selected });
        } else {
            setNewFood({ ...newFood, category: selected });
        }
    };

    if (!isAdmin && !isStaff) {
        return <Typography.Text>Bạn không có quyền truy cập trang này.</Typography.Text>;
    }

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'Ảnh',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            render: (url: string, r: MenuItemDTO) => (
                <img
                    src={url}
                    alt={r.name}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                />
            ),
        },
        { title: 'Tên món', dataIndex: 'name', key: 'name' },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (v: number) => `${v.toLocaleString()}đ`,
        },
        { title: 'Danh mục', dataIndex: ['category', 'name'], key: 'category' },
        isAdmin
            ? {
                title: 'Hành động',
                key: 'actions',
                render: (_: any, r: MenuItemDTO) => (
                    <>
                        <Button
                            size="small"
                            onClick={() => {
                                setEditingId(r.id || 0);
                                setEditFood(r);
                            }}
                        >
                            Sửa
                        </Button>
                        <Popconfirm title="Xóa món này?" onConfirm={() => deleteFood(r.id!)}>
                            <Button size="small" danger style={{ marginLeft: 8 }}>
                                Xóa
                            </Button>
                        </Popconfirm>
                    </>
                ),
            }
            : undefined,
    ].filter(Boolean) as any;

    return (
        <Card
            title={
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Danh sách Món Ăn
                </Typography.Title>
            }
            extra={
                isAdmin ? (
                    <Button type="primary" onClick={() => setShowCreateForm(true)}>
                        Thêm món ăn
                    </Button>
                ) : null
            }
        >
            <Table
                rowKey={(r) => String(r.id)}
                dataSource={danhSachMon}
                columns={columns}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Thêm món ăn"
                open={showCreateForm}
                onOk={createFood}
                onCancel={() => setShowCreateForm(false)}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form layout="vertical">
                    <Form.Item label="Tên món">
                        <Input
                            value={newFood.name}
                            onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                        />
                    </Form.Item>
                    <Form.Item label="Giá">
                        <InputNumber
                            value={newFood.price}
                            onChange={(v) => setNewFood({ ...newFood, price: Number(v) })}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item label="URL hình ảnh">
                        <Input
                            value={newFood.imageUrl}
                            onChange={(e) => setNewFood({ ...newFood, imageUrl: e.target.value })}
                        />
                    </Form.Item>
                    <Form.Item label="Mô tả">
                        <Input.TextArea
                            rows={3}
                            value={newFood.description}
                            onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
                        />
                    </Form.Item>
                    <Form.Item label="Danh mục">
                        <Select
                            value={newFood.category.name}
                            onChange={(v) => handleCategoryChange(v)}
                            options={categories.map((c) => ({ label: c.name, value: c.name }))}
                            placeholder="-- Chọn danh mục --"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Chỉnh sửa món ăn"
                open={editingId != null}
                onOk={updateFood}
                onCancel={() => setEditingId(null)}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form layout="vertical">
                    <Form.Item label="Tên món">
                        <Input
                            value={editFood.name}
                            onChange={(e) => setEditFood({ ...editFood, name: e.target.value })}
                        />
                    </Form.Item>
                    <Form.Item label="Giá">
                        <InputNumber
                            value={editFood.price}
                            onChange={(v) => setEditFood({ ...editFood, price: Number(v) })}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item label="URL hình ảnh">
                        <Input
                            value={editFood.imageUrl}
                            onChange={(e) => setEditFood({ ...editFood, imageUrl: e.target.value })}
                        />
                    </Form.Item>
                    <Form.Item label="Mô tả">
                        <Input.TextArea
                            rows={3}
                            value={editFood.description}
                            onChange={(e) => setEditFood({ ...editFood, description: e.target.value })}
                        />
                    </Form.Item>
                    <Form.Item label="Danh mục">
                        <Select
                            value={editFood.category.name}
                            onChange={(v) => handleCategoryChange(v, true)}
                            options={categories.map((c) => ({ label: c.name, value: c.name }))}
                            placeholder="-- Chọn danh mục --"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}
