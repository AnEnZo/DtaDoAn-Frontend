'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Button, Typography, App } from 'antd';
import {
    DashboardOutlined,
    AppstoreOutlined,
    CoffeeOutlined,
    AppstoreAddOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    DollarOutlined,
    GiftOutlined,
    TeamOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BulbOutlined,
    FireOutlined,
    MailOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout, loading } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [pageTitle, setPageTitle] = useState('Dashboard');
    const [pageSubtitle, setPageSubtitle] = useState('');

    // Redirect if not admin/staff
    useEffect(() => {
        if (!loading && user) {
            const isAdmin = user.roles?.includes('ROLE_ADMIN') ?? false;
            const isStaff = user.roles?.includes('ROLE_STAFF') ?? false;
            if (!isAdmin && !isStaff) {
                router.push('/home');
            }
        } else if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;

    // Map pathname to active menu key and title
    const getMenuInfo = (path: string) => {
        if (path === '/dashboard') return { key: 'dashboard', title: 'Dashboard Tổng Quan', subtitle: 'Chào mừng trở lại! Đây là tổng quan hệ thống của bạn.' };
        if (path.includes('/dashboard/categories')) return { key: 'categories', title: 'Quản Lý Danh Mục', subtitle: 'Quản lý các danh mục sản phẩm' };
        if (path.includes('/dashboard/foods')) return { key: 'foods', title: 'Quản Lý Món Ăn', subtitle: 'Quản lý thực đơn và món ăn' };
        if (path.includes('/dashboard/food-suggestions')) return { key: 'food-suggestions', title: 'Quản Lý Gợi Ý Món Ăn', subtitle: 'Xem gợi ý món ăn từ khách hàng' };
        if (path.includes('/dashboard/contacts')) return { key: 'contacts', title: 'Quản Lý Liên Hệ', subtitle: 'Xem và quản lý các liên hệ từ khách hàng' };
        if (path.includes('/dashboard/tables')) return { key: 'tables', title: 'Quản Lý Bàn', subtitle: 'Theo dõi trạng thái các bàn' };
        if (path.includes('/dashboard/orders')) return { key: 'orders', title: 'Quản Lý Đơn Hàng', subtitle: 'Xử lý và theo dõi đơn hàng' };
        if (path.includes('/dashboard/invoices')) return { key: 'invoices', title: 'Quản Lý Hóa Đơn', subtitle: 'Quản lý hóa đơn thanh toán' };
        if (path.includes('/dashboard/revenue')) return { key: 'revenue', title: 'Báo Cáo Doanh Thu', subtitle: 'Thống kê và phân tích doanh thu' };
        if (path.includes('/dashboard/vouchers')) return { key: 'vouchers', title: 'Quản Lý Voucher', subtitle: 'Tạo và quản lý các mã giảm giá' };
        if (path.includes('/dashboard/user-vouchers')) return { key: 'userVouchers', title: 'Voucher cá nhân', subtitle: 'Quản lý và sử dụng voucher của bạn' };
        if (path.includes('/dashboard/accounts')) return { key: 'accounts', title: 'Quản Lý Tài Khoản', subtitle: 'Quản lý người dùng hệ thống' };
        if (path.includes('/dashboard/profile')) return { key: 'profile', title: 'Thông Tin Cá Nhân', subtitle: 'Cập nhật thông tin cá nhân' };
        if (path.includes('/dashboard/hot-trends')) return { key: 'hot-trends', title: 'Hot Trend Món Ăn', subtitle: 'Xu hướng ẩm thực từ Google Trends & Llama AI' };
        return { key: 'dashboard', title: 'Dashboard', subtitle: '' };
    };

    const menuInfo = getMenuInfo(pathname);

    useEffect(() => {
        setPageTitle(menuInfo.title);
        setPageSubtitle(menuInfo.subtitle);
    }, [pathname]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
    }

    const menuItems = isAdmin
        ? [
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng Quan', onClick: () => router.push('/dashboard') },
            { key: 'categories', icon: <AppstoreOutlined />, label: 'Danh Mục', onClick: () => router.push('/dashboard/categories') },
            { key: 'foods', icon: <CoffeeOutlined />, label: 'Món Ăn', onClick: () => router.push('/dashboard/foods') },
            { key: 'food-suggestions', icon: <BulbOutlined />, label: 'Gợi Ý Món Ăn', onClick: () => router.push('/dashboard/food-suggestions') },
            { key: 'contacts', icon: <MailOutlined />, label: 'Liên Hệ', onClick: () => router.push('/dashboard/contacts') },
            { key: 'hot-trends', icon: <FireOutlined />, label: 'Hot Trends', onClick: () => router.push('/dashboard/hot-trends') },
            { key: 'tables', icon: <AppstoreAddOutlined />, label: 'Bàn', onClick: () => router.push('/dashboard/tables') },
            { key: 'orders', icon: <ShoppingCartOutlined />, label: 'Đơn Hàng', onClick: () => router.push('/dashboard/orders') },
            { key: 'invoices', icon: <FileTextOutlined />, label: 'Hóa Đơn', onClick: () => router.push('/dashboard/invoices') },
            { key: 'revenue', icon: <DollarOutlined />, label: 'Doanh Thu', onClick: () => router.push('/dashboard/revenue') },
            { key: 'vouchers', icon: <GiftOutlined />, label: 'Voucher', onClick: () => router.push('/dashboard/vouchers') },
            { key: 'userVouchers', icon: <GiftOutlined />, label: 'Voucher cá nhân', onClick: () => router.push('/dashboard/user-vouchers') },
            { key: 'accounts', icon: <TeamOutlined />, label: 'Tài Khoản', onClick: () => router.push('/dashboard/accounts') },
            { key: 'profile', icon: <UserOutlined />, label: 'Hồ Sơ', onClick: () => router.push('/dashboard/profile') },
        ]
        : [
            { key: 'orders', icon: <ShoppingCartOutlined />, label: 'Đơn Hàng', onClick: () => router.push('/dashboard/orders') },
            { key: 'tables', icon: <AppstoreAddOutlined />, label: 'Bàn', onClick: () => router.push('/dashboard/tables') },
            { key: 'invoices', icon: <FileTextOutlined />, label: 'Hóa Đơn', onClick: () => router.push('/dashboard/invoices') },
        ];

    return (
        <App>
            <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                breakpoint="lg"
                width={256}
                style={{ background: '#fff' }}
            >
                <div
                    style={{
                        padding: 16,
                        background: 'linear-gradient(135deg,#b45309,#f59e0b)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}
                >
                    <Avatar style={{ background: 'rgba(255,255,255,0.25)' }} icon={<CoffeeOutlined />} />
                    {!collapsed && (
                        <div>
                            <div style={{ fontWeight: 700 }}>The Coffee House</div>
                            <div style={{ opacity: 0.9 }}>{isAdmin ? 'Quản Trị Viên' : 'Nhân Viên'}</div>
                        </div>
                    )}
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[menuInfo.key]}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Header
                    style={{
                        background: '#fff',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingInline: 16,
                        paddingBlock: 10,
                        height: 'auto',
                        lineHeight: 'normal',
                        borderBottom: '1px solid #f0f0f0',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button
                            type="text"
                            onClick={() => setCollapsed(!collapsed)}
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        />
                        <div>
                            <Typography.Title level={3} style={{ margin: 0, lineHeight: 1.25 }}>
                                {pageTitle}
                            </Typography.Title>
                            <Typography.Text type="secondary">{pageSubtitle}</Typography.Text>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#b45309' }} />
                        {user.displayName ? <Typography.Text strong>{user.displayName}</Typography.Text> : null}
                        <Button type="primary" danger onClick={handleLogout}>
                            Đăng xuất
                        </Button>
                    </div>
                </Header>
                <Content style={{ background: '#f3f4f6' }}>
                    <div style={{ padding: 24 }}>
                        {children}
                    </div>
                </Content>
            </Layout>
            </Layout>
        </App>
    );
}
