'use client';

import React, { useEffect, useState } from 'react';
import {
    Card,
    Typography,
    Form,
    Input,
    Descriptions,
    Button,
    Alert,
    Avatar,
    Row,
    Col,
    Tag,
    Modal,
    Space,
    Spin,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

interface User {
    id: number;
    displayName: string;
    username: string;
    email: string;
    phoneNumber: string;
    rewardPoints: number;
    roles: string[];
    provider: string;
    providerId: string;
}

export default function DashboardProfilePage() {
    const router = useRouter();
    const { user: authUser, loading: authLoading } = useAuth();

    const [user, setUser] = useState<User | null>(null);
    const [formUser, setFormUser] = useState<Partial<User>>({});
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // OTP states
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [pendingUpdates, setPendingUpdates] = useState<Partial<User>>({});

    useEffect(() => {
        if (authLoading) return;

        if (!authUser) {
            router.push('/');
            return;
        }

        const fetchProfile = async () => {
            try {
                const token = getToken();
                if (!token) {
                    router.push('/');
                    return;
                }

                const res = await fetch(`${API_URL}/api/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error('Failed to fetch profile');

                const data = await res.json();
                setUser(data);
                setFormUser(data);
            } catch (err) {
                console.error(err);
                setError('Không thể tải thông tin người dùng.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [authUser, authLoading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormUser({
            ...formUser,
            [e.target.name]: e.target.value,
        });
    };

    const saveChanges = async () => {
        const token = getToken();
        if (!token) return;

        const updates: Partial<User> = {};
        if (formUser.email !== user?.email) updates.email = formUser.email as string;
        if (formUser.phoneNumber !== user?.phoneNumber)
            updates.phoneNumber = formUser.phoneNumber as string;

        // If email or phone changed, trigger OTP flow
        if (updates.email || updates.phoneNumber) {
            try {
                setOtpSending(true);
                const res = await fetch(`${API_URL}/api/users/me/otp/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email: updates.email ?? null,
                        phoneNumber: updates.phoneNumber ?? null,
                    }),
                });

                if (!res.ok) {
                    const errorData = await res.text();
                    throw new Error(errorData || 'Không thể gửi OTP');
                }

                setPendingUpdates(updates);
                setOtpModalOpen(true);
            } catch (e: any) {
                console.error(e);
                alert(e.message || 'Không thể gửi OTP tới email.');
            } finally {
                setOtpSending(false);
            }
            return;
        }

        // No sensitive changes -> normal update
        try {
            const res = await fetch(`${API_URL}/api/users/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formUser),
            });

            if (!res.ok) throw new Error('Lỗi cập nhật');

            const data = await res.json();
            setUser(data);
            setEditing(false);
        } catch (err) {
            console.error(err);
            alert('Lỗi khi cập nhật thông tin!');
        }
    };

    const verifyOtpAndApply = async () => {
        const token = getToken();
        if (!token) return;

        if (!otpCode || otpCode.trim().length === 0) {
            alert('Vui lòng nhập mã OTP');
            return;
        }

        try {
            setOtpVerifying(true);
            const body: any = { otp: otpCode.trim() };
            if (pendingUpdates.email != null) body.email = pendingUpdates.email;
            if (pendingUpdates.phoneNumber != null) body.phoneNumber = pendingUpdates.phoneNumber;

            const res = await fetch(`${API_URL}/api/users/me/otp/verify-update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorData = await res.text();
                throw new Error(errorData || 'Xác thực thất bại');
            }

            const data = await res.json();
            setUser(data);
            setFormUser(data);
            setEditing(false);
            setOtpModalOpen(false);
            setOtpCode('');
            setPendingUpdates({});
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Xác thực OTP thất bại.');
        } finally {
            setOtpVerifying(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (error) return <Alert type="error" message={error} showIcon className="m-4" />;
    if (!user) return null;

    return (
        <Card
            title={
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Thông tin cá nhân
                </Typography.Title>
            }
        >
            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card size="small" styles={{ body: { padding: 16 } }}>
                        <div
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
                        >
                            <Avatar size={96} style={{ background: '#a0522d', fontWeight: 800, fontSize: '2rem' }}>
                                {user.displayName?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>{user.displayName}</div>
                                <div style={{ color: '#6b7280' }}>@{user.username}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {user.roles.map((r) => (
                                    <Tag color="geekblue" key={r}>
                                        {r}
                                    </Tag>
                                ))}
                                <Tag color="gold">Điểm: {user.rewardPoints}</Tag>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={16}>
                    <Card size="small" styles={{ body: { padding: 16 } }}>
                        {!editing ? (
                            <Descriptions bordered column={1} size="middle">
                                <Descriptions.Item label="Họ tên">{user.displayName}</Descriptions.Item>
                                <Descriptions.Item label="Tên đăng nhập">{user.username}</Descriptions.Item>
                                <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                                <Descriptions.Item label="SĐT">{user.phoneNumber}</Descriptions.Item>
                                <Descriptions.Item label="Vai trò">
                                    {user.roles.join(', ')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Đăng nhập qua">
                                    {user.provider}
                                </Descriptions.Item>
                            </Descriptions>
                        ) : (
                            <Form layout="vertical">
                                <Row gutter={[12, 0]}>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Họ tên">
                                            <Input
                                                name="displayName"
                                                value={formUser.displayName || ''}
                                                onChange={handleChange}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Email">
                                            <Input name="email" value={formUser.email || ''} onChange={handleChange} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="SĐT">
                                            <Input
                                                name="phoneNumber"
                                                value={formUser.phoneNumber || ''}
                                                onChange={handleChange}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
                                    • Thay đổi <strong>Họ tên</strong> sẽ được lưu ngay, <em>không cần OTP</em>.
                                    <br />• Thay đổi <strong>Email</strong> hoặc <strong>SĐT</strong> sẽ yêu cầu{' '}
                                    <em>nhập mã OTP gửi về email</em> để xác nhận.
                                </Typography.Paragraph>
                            </Form>
                        )}

                        <div style={{ marginTop: 16, textAlign: 'right' }}>
                            {editing ? (
                                <>
                                    <Button
                                        type="primary"
                                        loading={otpSending}
                                        onClick={saveChanges}
                                        style={{ marginRight: 8 }}
                                    >
                                        Lưu
                                    </Button>
                                    <Button onClick={() => setEditing(false)}>Hủy</Button>
                                </>
                            ) : (
                                <Button type="primary" onClick={() => setEditing(true)}>
                                    Sửa thông tin
                                </Button>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            <Modal
                title="Xác thực OTP"
                open={otpModalOpen}
                onCancel={() => setOtpModalOpen(false)}
                footer={null}
                destroyOnHidden
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Typography.Paragraph>
                        Chúng tôi đã gửi mã OTP tới email của bạn. Vui lòng nhập mã để xác nhận thay đổi.
                    </Typography.Paragraph>
                    <Input
                        placeholder="Nhập mã OTP"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button
                            onClick={async () => {
                                const token = getToken();
                                if (!token) return;
                                try {
                                    setOtpSending(true);
                                    await fetch(`${API_URL}/api/users/me/otp/send`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                            email: pendingUpdates.email ?? null,
                                            phoneNumber: pendingUpdates.phoneNumber ?? null,
                                        }),
                                    });
                                } catch (e) {
                                    console.error(e);
                                } finally {
                                    setOtpSending(false);
                                }
                            }}
                        >
                            Gửi lại OTP
                        </Button>
                        <Button type="primary" loading={otpVerifying} onClick={verifyOtpAndApply}>
                            Xác nhận
                        </Button>
                    </div>
                </Space>
            </Modal>
        </Card>
    );
}
