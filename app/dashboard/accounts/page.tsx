'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Typography,
    Tag,
    Popconfirm,
    message,
} from 'antd';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

interface User {
    id: number;
    displayName: string;
    email: string;
    phoneNumber: string;
    provider: 'FACEBOOK' | 'GOOGLE' | 'LOCAL';
    providerId: string;
    rewardPoints: number;
    username: string;
    roles: string[];
}

export default function UserPage() {
    const { user } = useAuth();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');
    const [form] = Form.useForm();

    const [users, setUsers] = useState<User[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [formUser, setFormUser] = useState({
        displayName: '',
        email: '',
        phoneNumber: '',
        username: '',
        password: '',
        provider: 'LOCAL',
    });
    const [newRole, setNewRole] = useState<'USER' | 'STAFF'>('USER');
    const [editRole, setEditRole] = useState<'USER' | 'STAFF' | null>(null);
    const [editingIsAdmin, setEditingIsAdmin] = useState<boolean>(false);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const fetchUsers = async (page = 1, size = 10) => {
        const token = getToken();
        if (!token) return;

        try {
            // Spring Boot page is 0-indexed
            const response = await fetch(`${API_URL}/api/users?page=${page - 1}&size=${size}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data.content || []);
            setPagination({
                current: page,
                pageSize: size,
                total: data.totalElements || 0,
            });
        } catch (error) {
            console.error('Lỗi khi tải người dùng:', error);
        }
    };

    useEffect(() => {
        if (isAdmin) fetchUsers(pagination.current, pagination.pageSize);
    }, [isAdmin]);

    const handleTableChange = (newPagination: any) => {
        fetchUsers(newPagination.current, newPagination.pageSize);
    };

    const handleDeleteUser = async (id: number) => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to delete user');
            // Reload current page
            fetchUsers(pagination.current, pagination.pageSize);
            message.success('Xoá người dùng thành công');
        } catch (error) {
            console.error('Lỗi khi xoá người dùng:', error);
            message.error('Lỗi khi xoá người dùng.');
        }
    };

    const handleEditUser = (user: User) => {
        setShowForm(true);
        setIsEdit(true);
        setEditId(user.id);
        setFormUser({
            displayName: user.displayName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            username: user.username,
            password: '',
            provider: user.provider,
        });
        const isAdminRole = Array.isArray(user.roles) && user.roles.some((r) => r.includes('ADMIN'));
        setEditingIsAdmin(isAdminRole);
        // Prefill editRole if not admin
        if (!isAdminRole) {
            if (Array.isArray(user.roles) && user.roles.some((r) => r.includes('STAFF')))
                setEditRole('STAFF');
            else setEditRole('USER');
        } else {
            setEditRole(null);
        }
    };

    const handleSubmitUser = async () => {
        const token = getToken();
        if (!token) return;

        try {
            // Get values from form
            const values = form.getFieldsValue();
            let url = '';
            const payload: any = { ...values };

            if (isEdit) {
                url = `${API_URL}/api/users/${editId}`;
                if (values.editRole) {
                    payload.role = values.editRole;
                }
                // Update User API does not accept password anymore
                delete payload.password;
            } else {
                if (values.role === 'STAFF') {
                    url = `${API_URL}/api/users/staff`;
                } else {
                    url = `${API_URL}/api/users/user`;
                }
            }

            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                let errorMessage = 'Đã xảy ra lỗi';

                try {
                    // Try to parse as JSON and extract message
                    const errorJson = JSON.parse(text);
                    errorMessage = errorJson.message || errorJson.error || text;
                } catch {
                    // If not JSON, use the raw text (strip if too long)
                    errorMessage = text.length > 200 ? text.substring(0, 200) + '...' : text;
                }

                throw new Error(errorMessage);
            }

            // Reload current page
            fetchUsers(pagination.current, pagination.pageSize);

            // Reset form
            setShowForm(false);
            setIsEdit(false);
            setEditId(null);
            setFormUser({
                displayName: '',
                email: '',
                phoneNumber: '',
                username: '',
                password: '',
                provider: 'LOCAL',
            });
            setNewRole('USER');
            setEditRole(null);
            setEditingIsAdmin(false);
            message.success(isEdit ? 'Cập nhật thành công' : 'Thêm người dùng thành công');
        } catch (error: any) {
            console.error('Lỗi khi lưu người dùng:', error);
            message.error(`Lỗi: ${error.message}`);
        }
    };

    if (!isAdmin) {
        return <Typography.Text>Bạn không có quyền truy cập trang này.</Typography.Text>;
    }

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: 'Tên hiển thị', dataIndex: 'displayName', key: 'displayName' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'SĐT', dataIndex: 'phoneNumber', key: 'phoneNumber' },
        {
            title: 'Provider',
            dataIndex: 'provider',
            key: 'provider',
            render: (p: User['provider']) => <Tag>{p || 'LOCAL'}</Tag>,
        },
        { title: 'Username', dataIndex: 'username', key: 'username' },
        {
            title: 'Quyền',
            dataIndex: 'roles',
            key: 'roles',
            render: (roles: string[] = []) => (
                <>
                    {roles.map((r) => (
                        <Tag
                            key={r}
                            color={r.includes('ADMIN') ? 'red' : r.includes('STAFF') ? 'blue' : 'green'}
                        >
                            {r}
                        </Tag>
                    ))}
                </>
            ),
        },
        { title: 'Điểm thưởng', dataIndex: 'rewardPoints', key: 'rewardPoints' },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: any, r: User) => (
                <>
                    <Button size="small" onClick={() => handleEditUser(r)} style={{ marginRight: 8 }}>
                        Sửa
                    </Button>
                    {!(Array.isArray(r.roles) && r.roles.some((role) => role.includes('ADMIN'))) && (
                        <Popconfirm title="Xoá người dùng này?" onConfirm={() => handleDeleteUser(r.id)}>
                            <Button size="small" danger>
                                Xoá
                            </Button>
                        </Popconfirm>
                    )}
                </>
            ),
        },
    ];

    return (
        <Card
            title={
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Quản lý người dùng
                </Typography.Title>
            }
            extra={
                <Button
                    type="primary"
                    onClick={() => {
                        setShowForm(true);
                        setIsEdit(false);
                        setFormUser({
                            displayName: '',
                            email: '',
                            phoneNumber: '',
                            username: '',
                            password: '',
                            provider: 'LOCAL',
                        });
                    }}
                >
                    + Thêm người dùng
                </Button>
            }
        >
            <Table
                rowKey={(r) => String(r.id)}
                dataSource={users}
                columns={columns as any}
                pagination={pagination}
                onChange={handleTableChange}
            />

            <Modal
                title={isEdit ? 'Cập nhật người dùng' : 'Thêm người dùng'}
                open={showForm}
                onOk={() => form.validateFields().then(() => handleSubmitUser())}
                onCancel={() => {
                    setShowForm(false);
                    form.resetFields();
                }}
                okText={isEdit ? 'Cập nhật' : 'Lưu'}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Tên hiển thị"
                        name="displayName"
                        rules={[
                            { required: true, message: 'Tên hiển thị không được để trống' },
                            { min: 2, message: 'Tên phải có ít nhất 2 ký tự' },
                            { max: 50, message: 'Tên không được quá 50 ký tự' },
                        ]}
                        initialValue={formUser.displayName}
                    >
                        <Input placeholder="Nhập tên hiển thị" />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Email không được để trống' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                        initialValue={formUser.email}
                    >
                        <Input placeholder="Nhập email" />
                    </Form.Item>
                    <Form.Item
                        label="Số điện thoại"
                        name="phoneNumber"
                        rules={[
                            { required: true, message: 'Số điện thoại không được để trống' },
                            { pattern: /^[0-9]{11}$/, message: 'SĐT phải là 11 chữ số (VD: 01234567890)' },
                        ]}
                        initialValue={formUser.phoneNumber}
                        extra="Nhập 11 chữ số, ví dụ: 01234567890"
                    >
                        <Input placeholder="Nhập 11 chữ số" maxLength={11} />
                    </Form.Item>
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[
                            { required: true, message: 'Username không được để trống' },
                            { min: 3, message: 'Username phải có ít nhất 3 ký tự' },
                            { max: 50, message: 'Username không được quá 50 ký tự' },
                        ]}
                        initialValue={formUser.username}
                    >
                        <Input placeholder="Nhập username" />
                    </Form.Item>
                    {!isEdit && (
                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                { required: true, message: 'Password không được để trống' },
                                { min: 6, message: 'Password phải có ít nhất 6 ký tự' },
                                { max: 50, message: 'Password không được quá 50 ký tự' },
                                {
                                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                                    message: 'Password phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
                                },
                            ]}
                        >
                            <Input.Password placeholder="Nhập password" />
                        </Form.Item>
                    )}
                    {!isEdit && (
                        <Form.Item label="Quyền" name="role" initialValue={newRole}>
                            <Select
                                options={[
                                    { label: 'USER', value: 'USER' },
                                    { label: 'STAFF', value: 'STAFF' },
                                ]}
                            />
                        </Form.Item>
                    )}
                    {isEdit && !editingIsAdmin && (
                        <Form.Item label="Quyền" name="editRole" initialValue={editRole || 'USER'}>
                            <Select
                                options={[
                                    { label: 'USER', value: 'USER' },
                                    { label: 'STAFF', value: 'STAFF' },
                                ]}
                            />
                        </Form.Item>
                    )}
                    <Form.Item label="Provider" name="provider" initialValue={formUser.provider}>
                        <Select
                            options={[
                                { label: 'LOCAL', value: 'LOCAL' },
                                { label: 'GOOGLE', value: 'GOOGLE' },
                                { label: 'FACEBOOK', value: 'FACEBOOK' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}
