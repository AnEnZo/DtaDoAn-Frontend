'use client';

import React, { useEffect, useState, useRef } from 'react';
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
    Spin,
    App,
} from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';
import { uploadImageViaBackend } from '@/lib/cloudinary/upload';

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
    const { message } = App.useApp();
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

    const [uploadingNew, setUploadingNew] = useState(false);
    const [uploadProgressNew, setUploadProgressNew] = useState(0);
    const [uploadingEdit, setUploadingEdit] = useState(false);
    const [uploadProgressEdit, setUploadProgressEdit] = useState(0);
    const [newImagePreview, setNewImagePreview] = useState<string>('');
    const [editImagePreview, setEditImagePreview] = useState<string>('');
    const [pendingNewFile, setPendingNewFile] = useState<File | null>(null);
    const [pendingEditFile, setPendingEditFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const catData = await apiGet<CategoryDTO[]>('/api/categories');
                setCategories(catData);
                await fetchFoods(catData);
            } catch (err) {
                console.error('Lỗi khi load:', err);
                message.error(getErrorMessage(err, 'Lỗi khi tải dữ liệu món ăn'));
            }
        };

        fetchAll();
    }, []);

    const fetchFoods = async (loadedCategories: CategoryDTO[]) => {
        try {
            const data = await apiGet<any[]>('/api/menu-items');

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
            message.error(getErrorMessage(err, 'Lỗi khi lấy danh sách món ăn'));
        }
    };

    const handleFileSelect = (file: File, isEdit: boolean) => {
        const preview = URL.createObjectURL(file);
        if (isEdit) {
            if (editImagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(editImagePreview);
            }
            setEditImagePreview(preview);
            setPendingEditFile(file);
        } else {
            if (newImagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(newImagePreview);
            }
            setNewImagePreview(preview);
            setPendingNewFile(file);
            setNewFood((prev) => ({ ...prev, imageUrl: '' }));
        }
        return false;
    };

    const removeImage = (isEdit: boolean) => {
        if (isEdit) {
            if (editImagePreview?.startsWith('blob:')) URL.revokeObjectURL(editImagePreview);
            setEditImagePreview('');
            setPendingEditFile(null);
            setEditFood((prev) => ({ ...prev, imageUrl: '' }));
        } else {
            if (newImagePreview?.startsWith('blob:')) URL.revokeObjectURL(newImagePreview);
            setNewImagePreview('');
            setPendingNewFile(null);
            setNewFood((prev) => ({ ...prev, imageUrl: '' }));
        }
    };

    const resetCreateForm = () => {
        if (newImagePreview?.startsWith('blob:')) URL.revokeObjectURL(newImagePreview);
        setNewFood({ name: '', price: 0, imageUrl: '', category: { name: '' }, description: '' });
        setNewImagePreview('');
        setPendingNewFile(null);
        setUploadingNew(false);
        setUploadProgressNew(0);
    };

    const resetEditForm = () => {
        if (editImagePreview?.startsWith('blob:')) URL.revokeObjectURL(editImagePreview);
        setEditingId(null);
        setEditFood({ name: '', price: 0, imageUrl: '', category: { id: 0, name: '' }, description: '' });
        setEditImagePreview('');
        setPendingEditFile(null);
        setUploadingEdit(false);
        setUploadProgressEdit(0);
    };

    const createFood = async () => {
        if (uploadingNew) {
            message.warning('Vui lòng đợi thao tác hoàn tất');
            return;
        }

        let imageUrl = newFood.imageUrl;
        try {
            if (pendingNewFile) {
                setUploadingNew(true);
                setUploadProgressNew(0);
                imageUrl = await uploadImageViaBackend(pendingNewFile, (p) =>
                    setUploadProgressNew(p),
                );
            }

            if (!imageUrl?.trim()) {
                message.error('Vui lòng chọn ảnh món');
                return;
            }

            const data = await apiPost<MenuItemDTO>('/api/menu-items', { ...newFood, imageUrl });
            setDanhSachMon((prev) => [...prev, data]);
            resetCreateForm();
            setShowCreateForm(false);
            message.success('Thêm món ăn thành công');
        } catch (err) {
            console.error('Lỗi khi tạo món ăn:', err);
            message.error(getErrorMessage(err, 'Lỗi khi tạo món ăn'));
        } finally {
            setUploadingNew(false);
        }
    };

    const deleteFood = async (id: number) => {
        try {
            await apiDelete(`/api/menu-items/${id}`);
            setDanhSachMon((prev) => prev.filter((m) => m.id !== id));
            message.success('Xóa món ăn thành công');
        } catch (err) {
            console.error('Lỗi khi xóa món ăn:', err);
            // Hiển thị lý do từ backend (vd: món đang nằm trong đơn chưa thanh toán) trong 5s.
            message.error(getErrorMessage(err, 'Lỗi khi xóa món ăn'), 5);
        }
    };

    const updateFood = async () => {
        if (uploadingEdit) {
            message.warning('Vui lòng đợi thao tác hoàn tất');
            return;
        }
        if (!editingId) return;

        let imageUrl = editFood.imageUrl;
        try {
            if (pendingEditFile) {
                setUploadingEdit(true);
                setUploadProgressEdit(0);
                imageUrl = await uploadImageViaBackend(pendingEditFile, (p) =>
                    setUploadProgressEdit(p),
                );
            }

            if (!imageUrl?.trim()) {
                message.error('Vui lòng chọn ảnh món');
                return;
            }

            const data = await apiPut<MenuItemDTO>(`/api/menu-items/${editingId}`, { ...editFood, imageUrl });
            setDanhSachMon((prev) => prev.map((m) => (m.id === editingId ? data : m)));
            resetEditForm();
            message.success('Cập nhật món ăn thành công');
        } catch (err) {
            console.error('Lỗi khi cập nhật món ăn:', err);
            message.error(getErrorMessage(err, 'Lỗi khi cập nhật món ăn'));
        } finally {
            setUploadingEdit(false);
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

    const openEditModal = (food: MenuItemDTO) => {
        setEditingId(food.id || 0);
        setEditFood(food);
        setEditImagePreview(food.imageUrl || '');
        setPendingEditFile(null);
        setUploadingEdit(false);
        setUploadProgressEdit(0);
    };

    const ImageUploadField = ({
        imageUrl,
        imagePreview,
        onSelect,
        onRemove,
        uploading,
        uploadProgress,
    }: {
        imageUrl: string;
        imagePreview: string;
        onSelect: (file: File) => void;
        onRemove: () => void;
        uploading: boolean;
        uploadProgress: number;
    }) => {
        const inputRef = useRef<HTMLInputElement>(null);

        return (
            <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Hình ảnh</label>

                {uploading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Spin size="small" />
                        <span>Đang tải ảnh lên... {uploadProgress}%</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            icon={<UploadOutlined />}
                            onClick={() => inputRef.current?.click()}
                        >
                            Chọn ảnh
                        </Button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onSelect(file);
                                e.target.value = '';
                            }}
                        />
                        {(imagePreview || imageUrl) && (
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={onRemove}
                            >
                                Xóa ảnh
                            </Button>
                        )}
                    </div>
                )}

                {(imagePreview || imageUrl) && !uploading && (
                    <div style={{ marginTop: 8 }}>
                        <img
                            src={imagePreview || imageUrl}
                            alt="preview"
                            style={{
                                width: 120,
                                height: 120,
                                objectFit: 'cover',
                                borderRadius: 6,
                                border: '1px solid #d9d9d9',
                            }}
                        />
                    </div>
                )}
            </div>
        );
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
        { title: 'Giá', dataIndex: 'price', key: 'price', render: (v: number) => `${v.toLocaleString()}đ` },
        { title: 'Danh mục', dataIndex: ['category', 'name'], key: 'category' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
        isAdmin
            ? {
                title: 'Hành động',
                key: 'actions',
                render: (_: any, r: MenuItemDTO) => (
                    <>
                        <Button size="small" onClick={() => openEditModal(r)}>
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
                onCancel={() => {
                    resetCreateForm();
                    setShowCreateForm(false);
                }}
                okText="Lưu"
                cancelText="Hủy"
                okButtonProps={{ disabled: uploadingNew }}
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
                    <Form.Item
                        label="Hình ảnh"
                        tooltip="Chọn ảnh để xem trước; ảnh chỉ được tải lên khi bạn bấm Lưu"
                    >
                        <ImageUploadField
                            imageUrl={newFood.imageUrl}
                            imagePreview={newImagePreview}
                            onSelect={(file) => handleFileSelect(file, false)}
                            onRemove={() => removeImage(false)}
                            uploading={uploadingNew}
                            uploadProgress={uploadProgressNew}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Chỉnh sửa món ăn"
                open={editingId != null}
                onOk={updateFood}
                onCancel={resetEditForm}
                okText="Lưu"
                cancelText="Hủy"
                okButtonProps={{ disabled: uploadingEdit }}
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
                    <Form.Item
                        label="Hình ảnh"
                        tooltip="Chọn ảnh mới để xem trước; ảnh chỉ được tải lên khi bạn bấm Lưu"
                    >
                        <ImageUploadField
                            imageUrl={editFood.imageUrl}
                            imagePreview={editImagePreview}
                            onSelect={(file) => handleFileSelect(file, true)}
                            onRemove={() => removeImage(true)}
                            uploading={uploadingEdit}
                            uploadProgress={uploadProgressEdit}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}
