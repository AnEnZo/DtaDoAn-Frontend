'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Button, Input, Space, Typography, message, Tag, Modal, Popconfirm } from 'antd';
import { ReloadOutlined, EyeOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

interface ContactMessage {
    id: number;
    name: string;
    email: string;
    message: string;
    status: 'UNREAD' | 'READ';
    createdAt: string;
    updatedAt: string;
}

export default function ContactsAdminPage() {
    const [contacts, setContacts] = useState<ContactMessage[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<ContactMessage[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    // Pagination states
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const fetchContacts = useCallback(async (currentPage = page, currentPageSize = pageSize) => {
        const token = getToken();
        if (!token) {
            message.error('Bạn chưa đăng nhập.');
            return;
        }

        setLoading(true);
        try {
            // Backend is 0-based index for pages, frontend AntD is 1-based index
            const response = await fetch(`${API_URL}/api/contacts?page=${currentPage - 1}&size=${currentPageSize}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                throw new Error('Không thể lấy danh sách liên hệ');
            }

            const data = await response.json();
            setContacts(data.content || []);
            setTotal(data.totalElements || 0);
        } catch (err) {
            message.error('Lỗi khi tải danh sách liên hệ. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => {
        fetchContacts(page, pageSize);
    }, [page, pageSize, fetchContacts]);

    useEffect(() => {
        const keyword = search.toLowerCase().trim();
        const filtered = keyword
            ? contacts.filter(
                  (c) =>
                      c.name.toLowerCase().includes(keyword) ||
                      c.email.toLowerCase().includes(keyword) ||
                      c.message.toLowerCase().includes(keyword)
              )
            : contacts;
        setFilteredContacts(filtered);
    }, [contacts, search]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleMarkAsRead = async (id: number) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/contacts/${id}/status?status=READ`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Lỗi khi cập nhật trạng thái');
            }

            message.success('Đã đánh dấu là đã đọc.');
            // Refresh list for current page
            fetchContacts(page, pageSize);
        } catch (err) {
            message.error('Không thể cập nhật trạng thái liên hệ.');
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/contacts/read-all`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Lỗi khi đánh dấu đã đọc tất cả');
            }

            message.success('Đã đánh dấu đã đọc tất cả các liên hệ.');
            // Refresh list for current page
            fetchContacts(page, pageSize);
        } catch (err) {
            message.error('Không thể đánh dấu đã đọc tất cả.');
            console.error(err);
        }
    };

    const handleViewDetail = (contact: ContactMessage) => {
        setSelectedContact(contact);
        setDetailModalOpen(true);

        // If the message is unread, automatically mark it as read when viewed
        if (contact.status === 'UNREAD') {
            handleMarkAsRead(contact.id);
        }
    };

    const handleDelete = async (id: number) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/contacts/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Lỗi khi xóa liên hệ');
            }

            message.success('Đã xóa liên hệ.');
            fetchContacts(page, pageSize);
        } catch (err) {
            message.error('Không thể xóa liên hệ.');
            console.error(err);
        }
    };

    const getStatusTag = (status: 'UNREAD' | 'READ') => {
        if (status === 'UNREAD') {
            return <Tag color="volcano">Chưa đọc</Tag>;
        }
        return <Tag color="green">Đã đọc</Tag>;
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a: any, b: any) => a.id - b.id },
        {
            title: 'Họ và tên',
            dataIndex: 'name',
            key: 'name',
            width: 180,
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 200,
        },
        {
            title: 'Nội dung liên hệ',
            dataIndex: 'message',
            key: 'message',
            width: 350,
            ellipsis: true,
            render: (text: string) => text,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: 'UNREAD' | 'READ') => getStatusTag(status),
        },
        {
            title: 'Ngày gửi',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (date: string) => new Date(date).toLocaleString('vi-VN'),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 220,
            fixed: 'right' as const,
            render: (_: any, record: ContactMessage) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        ghost
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record)}
                    >
                        Xem chi tiết
                    </Button>
                    {record.status === 'UNREAD' && (
                        <Button
                            type="default"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleMarkAsRead(record.id)}
                            style={{ color: '#52c41a', borderColor: '#52c41a' }}
                        >
                            Đã đọc
                        </Button>
                    )}
                    <Popconfirm
                        title="Xóa liên hệ"
                        description="Bạn có chắc chắn muốn xóa tin nhắn liên hệ này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button danger icon={<DeleteOutlined />} />
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
                        Quản lý Liên Hệ
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Xem và xử lý các yêu cầu liên hệ từ khách hàng
                    </Typography.Text>
                </Space>
            }
            extra={
                <Space>
                    <Input
                        placeholder="Tìm trong trang này..."
                        allowClear
                        onChange={handleSearch}
                        value={search}
                        style={{ width: 220 }}
                    />
                    <Popconfirm
                        title="Đánh dấu đã đọc tất cả"
                        description="Bạn có chắc chắn muốn đánh dấu đã đọc cho tất cả các liên hệ?"
                        onConfirm={handleMarkAllAsRead}
                        okText="Đồng ý"
                        cancelText="Hủy"
                    >
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            disabled={loading}
                        >
                            Đọc tất cả
                        </Button>
                    </Popconfirm>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchContacts(page, pageSize)}
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
                dataSource={filteredContacts}
                pagination={{
                    current: page,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    onChange: (p, s) => {
                        setPage(p);
                        setPageSize(s);
                    },
                }}
                locale={{ emptyText: 'Chưa có liên hệ nào.' }}
                scroll={{ x: 1200 }}
            />

            <Modal
                title={<span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Chi tiết tin nhắn liên hệ</span>}
                open={detailModalOpen}
                onCancel={() => {
                    setDetailModalOpen(false);
                    setSelectedContact(null);
                }}
                footer={[
                    <Button
                        key="close"
                        type="primary"
                        onClick={() => {
                            setDetailModalOpen(false);
                            setSelectedContact(null);
                        }}
                    >
                        Đóng
                    </Button>,
                ]}
                width={600}
            >
                {selectedContact && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <p><strong>Khách hàng:</strong> {selectedContact.name}</p>
                        <p><strong>Email:</strong> {selectedContact.email}</p>
                        <p><strong>Ngày gửi:</strong> {new Date(selectedContact.createdAt).toLocaleString('vi-VN')}</p>
                        <p><strong>Trạng thái:</strong> {getStatusTag(selectedContact.status)}</p>
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '8px',
                            borderLeft: '4px solid #b45309',
                            whiteSpace: 'pre-wrap'
                        }}>
                            <strong>Nội dung lời nhắn:</strong>
                            <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#333' }}>{selectedContact.message}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
}
