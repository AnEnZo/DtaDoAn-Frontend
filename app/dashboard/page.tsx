'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, List, Avatar, InputNumber, Button, Space, message } from 'antd';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiGet } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            const isStaff = user.roles?.includes('ROLE_STAFF') ?? false;
            if (isStaff) {
                router.replace('/dashboard/orders');
            }
        }
    }, [user, loading, router]);

    const [revenue7Days, setRevenue7Days] = useState<{ label: string; revenue: number }[]>([]);
    const [revLoading, setRevLoading] = useState<boolean>(false);
    const [topItems, setTopItems] = useState<
        Array<{ itemName: string; quantitySold: number; price: number; imageUrl: string }>
    >([]);
    const [topItemsLoading, setTopItemsLoading] = useState<boolean>(false);
    const [topN, setTopN] = useState<number>(5);
    const [topNInput, setTopNInput] = useState<number>(5);
    const [summary, setSummary] = useState<{
        ordersToday: number;
        pendingOrders: number;
        tablesInUse: number;
        totalTables: number;
        utilizationPct: number;
        newCustomersThisMonth: number;
    } | null>(null);
    const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    const orderColumns = [
        { title: 'Mã ĐH', dataIndex: 'id', key: 'id' },
        { title: 'Bàn', dataIndex: 'table', key: 'table' },
        { title: 'Khách Hàng', dataIndex: 'customer', key: 'customer' },
        { title: 'Tổng Tiền', dataIndex: 'total', key: 'total' },
        { title: 'Trạng Thái', dataIndex: 'status', key: 'status' },
        { title: 'Thời Gian', dataIndex: 'time', key: 'time' },
    ];

    // Fetch Summary
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setSummaryLoading(true);
                const data = await apiGet<typeof summary>('/api/dashboard/summary');
                setSummary(data);
            } catch (e) {
                console.error(e);
                message.error(getErrorMessage(e, 'Lỗi khi tải số liệu tổng quan'));
            } finally {
                setSummaryLoading(false);
            }
        };
        fetchSummary();
        const id = setInterval(fetchSummary, 30000);
        return () => clearInterval(id);
    }, []);

    // Fetch Revenue 7 Days
    useEffect(() => {
        const fetchLast7Days = async () => {
            try {
                setRevLoading(true);

                const today = new Date();
                const days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(today);
                    d.setDate(today.getDate() - (6 - i));
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const iso = `${yyyy}-${mm}-${dd}`;
                    const label = `${dd}/${mm}`;
                    return { iso, label };
                });

                const results = await Promise.all(
                    days.map(async (day) => {
                        try {
                            const data = await apiGet<number>(`/api/revenues/date/${day.iso}`);
                            return {
                                label: day.label,
                                revenue: typeof data === 'number' ? data : Number(data),
                            };
                        } catch {
                            return { label: day.label, revenue: 0 };
                        }
                    })
                );
                setRevenue7Days(results);
            } catch (e) {
                console.error(e);
                message.error(getErrorMessage(e, 'Lỗi khi tải doanh thu 7 ngày'));
            } finally {
                setRevLoading(false);
            }
        };
        fetchLast7Days();
        const id = setInterval(fetchLast7Days, 30000);
        return () => clearInterval(id);
    }, []);

    // Fetch Top Items
    useEffect(() => {
        const fetchTopItems = async () => {
            try {
                setTopItemsLoading(true);
                const data = await apiGet<any[]>(`/api/revenues/items/top?topN=${topN}`);
                const mapped = (Array.isArray(data) ? data : []).map((it: any) => ({
                    itemName: it.itemName,
                    quantitySold: Number(it.quantitySold),
                    price: Number(it.price),
                    imageUrl: it.imageUrl,
                }));
                setTopItems(mapped);
            } catch (e) {
                console.error(e);
                message.error(getErrorMessage(e, 'Lỗi khi tải món bán chạy'));
            } finally {
                setTopItemsLoading(false);
            }
        };
        fetchTopItems();
        const id = setInterval(fetchTopItems, 30000);
        return () => clearInterval(id);
    }, [topN]);

    // Fetch Recent Orders
    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const page = await apiGet<any>('/api/orders?page=0&size=5&sort=orderTime,desc');
                const rows = (page?.content || []).map((o: any) => {
                    const items = Array.isArray(o.orderItems) ? o.orderItems : [];
                    const totalNum = items.reduce(
                        (sum: number, it: any) =>
                            sum + Number(it?.menuItem?.price || 0) * Number(it?.quantity || 0),
                        0,
                    );
                    return {
                        key: String(o.id),
                        id: `#${o.id}`,
                        table: o?.table?.name || '-',
                        customer: o?.customer?.displayName || '-',
                        total: `${totalNum.toLocaleString('vi-VN')}₫`,
                        status: String(o?.status || ''),
                        time: o?.orderTime ? new Date(o.orderTime).toLocaleString('vi-VN') : '',
                    };
                });
                setRecentOrders(rows);
            } catch (e) {
                console.error(e);
                message.error(getErrorMessage(e, 'Lỗi khi tải đơn hàng gần đây'));
            }
        };
        fetchRecent();
        const id = setInterval(fetchRecent, 30000);
        return () => clearInterval(id);
    }, []);

    const isStaff = user?.roles?.includes('ROLE_STAFF') ?? false;

    if (loading || isStaff) {
        return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
    }

    return (
        <>
            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={12} lg={6}>
                    <Card>
                        {(() => {
                            const todayRevenue =
                                revenue7Days.length > 0
                                    ? revenue7Days[revenue7Days.length - 1].revenue
                                    : 0;
                            const yesterdayRevenue =
                                revenue7Days.length > 1
                                    ? revenue7Days[revenue7Days.length - 2].revenue
                                    : 0;
                            const deltaPct = yesterdayRevenue
                                ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
                                : 0;
                            const positive = deltaPct >= 0;
                            return (
                                <>
                                    <Statistic
                                        title="Doanh Thu Hôm Nay"
                                        value={todayRevenue}
                                        suffix="₫"
                                        loading={revLoading && revenue7Days.length === 0}
                                        formatter={(val) => Number(val as number).toLocaleString('vi-VN')}
                                        valueStyle={{ color: positive ? '#16a34a' : '#dc2626' }}
                                    />
                                    <Typography.Text type={positive ? 'success' : 'danger'}>
                                        {`${positive ? '+' : ''}${deltaPct.toFixed(2)}% so với hôm qua`}
                                    </Typography.Text>
                                </>
                            );
                        })()}
                    </Card>
                </Col>
                <Col xs={24} md={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Đơn Hàng Mới"
                            value={summary?.ordersToday ?? 0}
                            loading={summaryLoading && !summary}
                        />
                        <Typography.Text type="secondary">
                            {summary?.pendingOrders ?? 0} đang chờ xử lý
                        </Typography.Text>
                    </Card>
                </Col>
                <Col xs={24} md={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Bàn Đang Dùng"
                            value={summary?.tablesInUse ?? 0}
                            suffix={`/${summary?.totalTables ?? 0}`}
                            loading={summaryLoading && !summary}
                        />
                        <Typography.Text type="warning">
                            {(() => {
                                const pct = summary?.utilizationPct ?? 0;
                                const safe = isNaN(Number(pct)) ? 0 : Math.round(Number(pct));
                                return `${safe}% công suất`;
                            })()}
                        </Typography.Text>
                    </Card>
                </Col>
                <Col xs={24} md={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Khách Hàng Mới"
                            value={summary?.newCustomersThisMonth ?? 0}
                            loading={summaryLoading && !summary}
                        />
                        <Typography.Text type="secondary">Tháng này</Typography.Text>
                    </Card>
                </Col>
            </Row>

            {/* Charts + Top products */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} lg={12}>
                    <Card
                        title="Doanh Thu 7 Ngày Qua"
                        extra={<Typography.Text type="secondary">Doanh thu (VNĐ)</Typography.Text>}
                    >
                        <div style={{ height: 280, overflow: 'visible' }}>
                            {revLoading && revenue7Days.length === 0 ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                    }}
                                >
                                    Đang tải...
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={revenue7Days}
                                        margin={{ left: 24, right: 8, top: 8, bottom: 8 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="label" />
                                        <YAxis
                                            width={110}
                                            allowDecimals={false}
                                            domain={[0, 'auto']}
                                            tickFormatter={(v) => Number(v).toLocaleString('vi-VN')}
                                        />
                                        <Tooltip
                                            formatter={(value) =>
                                                `${Number(value as number).toLocaleString('vi-VN')} ₫`
                                            }
                                        />
                                        <Bar dataKey="revenue" fill="#13dd0fff" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card
                        title="Món Bán Chạy"
                        extra={
                            <Space size={8}>
                                <Typography.Text type="secondary">Top {topN}</Typography.Text>
                                <InputNumber
                                    min={1}
                                    max={50}
                                    value={topNInput}
                                    onChange={(v) => setTopNInput((v as number) || 1)}
                                    style={{ width: 80 }}
                                />
                                <Button size="small" onClick={() => setTopN(topNInput)}>
                                    Áp dụng
                                </Button>
                            </Space>
                        }
                    >
                        <div style={{ height: 280 }}>
                            {topItemsLoading ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                    }}
                                >
                                    Đang tải...
                                </div>
                            ) : (
                                <div style={{ height: '100%', overflow: 'auto' }}>
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={topItems}
                                        renderItem={(item) => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    avatar={<Avatar shape="square" size={48} src={item.imageUrl} />}
                                                    title={
                                                        <Typography.Text strong>{item.itemName}</Typography.Text>
                                                    }
                                                    description={
                                                        <Typography.Text type="secondary">
                                                            {item.price.toLocaleString('vi-VN')}₫
                                                        </Typography.Text>
                                                    }
                                                />
                                                <div style={{ textAlign: 'right' }}>
                                                    <Typography.Title level={5} style={{ margin: 0 }}>
                                                        {item.quantitySold}
                                                    </Typography.Title>
                                                    <Typography.Text type="secondary">đã bán</Typography.Text>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Recent Orders */}
            <Card title="Đơn Hàng Gần Đây" variant="borderless">
                <Table columns={orderColumns} dataSource={recentOrders} pagination={false} />
            </Card>
        </>
    );
}
