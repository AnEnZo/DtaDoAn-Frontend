'use client';

import React, { useEffect, useState } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Typography,
    message,
    Tag,
    Tabs,
    DatePicker,
    Row,
    Col,
    Spin,
} from 'antd';
import {
    ReloadOutlined,
    FireOutlined,
    ThunderboltOutlined,
    RiseOutlined,
    HistoryOutlined,
    InstagramOutlined,
} from '@ant-design/icons';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';
import type { Dayjs } from 'dayjs';

const GEO = 'VN';
const LIMIT = 20;

interface FoodTrendItem {
    foodName: string;
    hotnessScore: number | null;
    searchVolume: number | null;
    increasePercentage: number | null;
    status: string | null;
    lastUpdatedAt: string | null;
    firstSeenAt: string | null;
}

interface FoodTrendsResponse {
    totalTrends: number;
    geo: string;
    timeRange: string | null;
    dataSource: string | null;
    savedToDatabase: boolean;
    date: string | null;
    trends: FoodTrendItem[];
}

interface PipelineResult {
    fetch: {
        status: string;
        geo: string;
        fetched: number;
        reason: string | null;
    };
    analyze: {
        geo: string;
        analyzed: number;
        foodTrendsFound: number;
        saved: number;
        skipped: number;
    };
}

interface InstagramTrendingFood {
    id: number;
    name: string;
    hashtag: string;
    rank: number;
    score: number;
    engagement: {
        average: number;
        recent: number;
        growthRate: number;
        posts24h: number;
    };
    trendStatus: string;
    updatedAt: string;
}

// ============================================================
// Stat Card component (giống revenue page)
// ============================================================
const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle: string;
    color: string;
}> = ({ icon, title, value, subtitle, color }) => (
    <Card
        style={{
            borderRadius: 12,
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            background: '#fff',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: `${color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: color,
                }}
            >
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', marginBottom: 2 }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{subtitle}</div>
            </div>
        </div>
    </Card>
);

// ============================================================
// Trend score badge
// ============================================================
const ScoreTag = ({ score }: { score: number | null }) => {
    if (score == null) return <Tag>—</Tag>;
    if (score >= 70) return <Tag color="red">🔴 {score}</Tag>;
    if (score >= 40) return <Tag color="orange">🟠 {score}</Tag>;
    return <Tag color="gold">🟡 {score}</Tag>;
};

// ============================================================
// Shared table columns
// ============================================================
const trendColumns = [
    {
        title: '#',
        key: 'index',
        width: 50,
        render: (_: any, __: any, index: number) => index + 1,
    },
    {
        title: 'Tên món / Xu hướng',
        dataIndex: 'foodName',
        key: 'foodName',
        width: 220,
        render: (text: string) => <strong>{text}</strong>,
    },
    {
        title: 'Trend Score',
        dataIndex: 'hotnessScore',
        key: 'hotnessScore',
        width: 130,
        sorter: (a: FoodTrendItem, b: FoodTrendItem) => (b.hotnessScore ?? 0) - (a.hotnessScore ?? 0),
        render: (score: number | null) => <ScoreTag score={score} />,
    },
    {
        title: 'Search Volume',
        dataIndex: 'searchVolume',
        key: 'searchVolume',
        width: 150,
        sorter: (a: FoodTrendItem, b: FoodTrendItem) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0),
        render: (v: number | null) =>
            v != null ? (
                <span style={{ fontWeight: 600 }}>{v.toLocaleString('vi-VN')}</span>
            ) : (
                <span style={{ color: '#999' }}>—</span>
            ),
    },
    {
        title: 'Tăng trưởng',
        dataIndex: 'increasePercentage',
        key: 'increasePercentage',
        width: 130,
        render: (v: number | null) =>
            v != null ? (
                <span style={{ color: '#16a34a', fontWeight: 600 }}>+{v}%</span>
            ) : (
                <span style={{ color: '#999' }}>—</span>
            ),
    },
    {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (s: string | null) =>
            s === 'ACTIVE' ? <Tag color="green">ACTIVE</Tag> : <Tag>{s ?? '—'}</Tag>,
    },
    {
        title: 'Cập nhật lúc',
        dataIndex: 'lastUpdatedAt',
        key: 'lastUpdatedAt',
        width: 180,
        render: (d: string | null) =>
            d ? new Date(d).toLocaleString('vi-VN') : <span style={{ color: '#999' }}>—</span>,
    },
];

// ============================================================
// Tab 1 — Hôm nay
// ============================================================
function TodayTab() {
    const [data, setData] = useState<FoodTrendItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [pipelineRunning, setPipelineRunning] = useState(false);
    const [lastPipeline, setLastPipeline] = useState<PipelineResult | null>(null);

    const fetchToday = async () => {
        const token = getToken();
        if (!token) { message.error('Chưa đăng nhập.'); return; }
        setLoading(true);
        try {
            const res = await fetch(
                `${API_URL}/api/serpapi/food-trends/today?geo=${GEO}&limit=${LIMIT}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Lỗi API');
            const body: FoodTrendsResponse = await res.json();
            setData(body.trends ?? []);
        } catch {
            message.error('Không thể tải dữ liệu hôm nay.');
        } finally {
            setLoading(false);
        }
    };

    const runPipeline = async () => {
        const token = getToken();
        if (!token) { message.error('Chưa đăng nhập.'); return; }
        setPipelineRunning(true);
        try {
            const res = await fetch(
                `${API_URL}/api/serpapi/food-trends/pipeline?geo=${GEO}&hours=24`,
                { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Lỗi pipeline');
            const result: PipelineResult = await res.json();
            setLastPipeline(result);
            if (result.analyze.foodTrendsFound > 0) {
                message.success(
                    `Pipeline hoàn tất! Tìm thấy ${result.analyze.foodTrendsFound} xu hướng F&B, lưu ${result.analyze.saved} mới.`
                );
            } else {
                message.warning(
                    `Pipeline chạy xong nhưng Llama không tìm thấy xu hướng ẩm thực nào trong ${result.analyze.analyzed} queries hôm nay.`
                );
            }
            await fetchToday(); // reload bảng
        } catch {
            message.error('Chạy pipeline thất bại. Vui lòng thử lại.');
        } finally {
            setPipelineRunning(false);
        }
    };

    useEffect(() => { fetchToday(); }, []);

    return (
        <div>
            {/* Stat Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <StatCard
                        icon={<FireOutlined />}
                        title="Xu hướng hôm nay"
                        value={data.length}
                        subtitle={`Khu vực: ${GEO}`}
                        color="#ef4444"
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <StatCard
                        icon={<ThunderboltOutlined />}
                        title="Đã phân tích (lần cuối)"
                        value={lastPipeline ? lastPipeline.analyze.analyzed : '—'}
                        subtitle="Queries gửi lên Llama"
                        color="#f59e0b"
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <StatCard
                        icon={<RiseOutlined />}
                        title="Lưu mới (lần cuối)"
                        value={lastPipeline ? lastPipeline.analyze.saved : '—'}
                        subtitle="Sau khi chạy pipeline"
                        color="#10b981"
                    />
                </Col>
            </Row>

            {/* Table */}
            <Card
                title={
                    <Space direction="vertical" size={0}>
                        <Typography.Title level={4} style={{ margin: 0 }}>
                            Hot Trend Hôm Nay
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            Dữ liệu từ Google Trends · Phân tích bởi Llama AI · Khu vực: {GEO}
                        </Typography.Text>
                    </Space>
                }
                extra={
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchToday}
                            disabled={loading || pipelineRunning}
                        >
                            Làm mới
                        </Button>
                        <Button
                            type="primary"
                            icon={<ThunderboltOutlined />}
                            loading={pipelineRunning}
                            onClick={runPipeline}
                            style={{ background: '#b45309', borderColor: '#b45309' }}
                        >
                            Chạy Pipeline
                        </Button>
                    </Space>
                }
                variant="outlined"
            >
                {/* Pipeline result summary */}
                {lastPipeline && (
                    <div
                        style={{
                            marginBottom: 16,
                            padding: '10px 16px',
                            borderRadius: 8,
                            background: lastPipeline.analyze.foodTrendsFound > 0 ? '#f0fdf4' : '#fffbeb',
                            border: `1px solid ${lastPipeline.analyze.foodTrendsFound > 0 ? '#bbf7d0' : '#fde68a'}`,
                            fontSize: '0.875rem',
                            color: lastPipeline.analyze.foodTrendsFound > 0 ? '#166534' : '#92400e',
                        }}
                    >
                        {lastPipeline.analyze.foodTrendsFound > 0 ? '✅' : '⚠️'}{' '}
                        Pipeline: fetch=<strong>{lastPipeline.fetch.status}</strong> ({lastPipeline.fetch.fetched} records) ·
                        phân tích <strong>{lastPipeline.analyze.analyzed}</strong> queries →
                        tìm được <strong>{lastPipeline.analyze.foodTrendsFound}</strong> xu hướng F&B ·
                        lưu=<strong>{lastPipeline.analyze.saved}</strong> ·
                        bỏ qua=<strong>{lastPipeline.analyze.skipped}</strong>
                        {lastPipeline.analyze.foodTrendsFound === 0 && (
                            <span style={{ marginLeft: 8, opacity: 0.8 }}>
                                — Llama không nhận diện được xu hướng ẩm thực trong {lastPipeline.analyze.analyzed} queries hôm nay.
                            </span>
                        )}
                    </div>
                )}

                <Table
                    rowKey={(r) => r.foodName + (r.lastUpdatedAt ?? '')}
                    loading={loading}
                    columns={trendColumns as any}
                    dataSource={data}
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20'] }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: '24px 0', color: '#6b7280' }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🍜</div>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có dữ liệu hôm nay</div>
                                <div style={{ fontSize: '0.85rem' }}>
                                    Bấm <strong>"Chạy Pipeline"</strong> để lấy dữ liệu mới, hoặc xem các ngày trước ở tab <strong>"Lịch sử"</strong>.
                                </div>
                            </div>
                        )
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>
        </div>
    );
}

// ============================================================
// Tab 2 — Lịch sử
// ============================================================
function HistoryTab() {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [data, setData] = useState<FoodTrendItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchHistory = async (date: Dayjs) => {
        const token = getToken();
        if (!token) { message.error('Chưa đăng nhập.'); return; }
        setLoading(true);
        setSearched(true);
        try {
            const dateStr = date.format('YYYY-MM-DD');
            const res = await fetch(
                `${API_URL}/api/serpapi/food-trends/history?geo=${GEO}&date=${dateStr}&limit=${LIMIT}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Lỗi API');
            const body: FoodTrendsResponse = await res.json();
            setData(body.trends ?? []);
            if ((body.trends ?? []).length === 0) {
                message.info(`Không có dữ liệu cho ngày ${dateStr}.`);
            }
        } catch {
            message.error('Không thể tải dữ liệu lịch sử.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            title={
                <Space direction="vertical" size={0}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        📅 Lịch Sử Hot Trend
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Chọn ngày để xem xu hướng ẩm thực đã lưu · Khu vực: {GEO}
                    </Typography.Text>
                </Space>
            }
            extra={
                <Space>
                    <DatePicker
                        value={selectedDate}
                        onChange={(d) => setSelectedDate(d)}
                        format="DD/MM/YYYY"
                        placeholder="Chọn ngày"
                        disabledDate={(current) => current && current.isAfter(new Date(), 'day')}
                    />
                    <Button
                        type="primary"
                        icon={<HistoryOutlined />}
                        disabled={!selectedDate || loading}
                        onClick={() => selectedDate && fetchHistory(selectedDate)}
                        style={{ background: '#b45309', borderColor: '#b45309' }}
                    >
                        Xem
                    </Button>
                </Space>
            }
            variant="outlined"
        >
            {!searched ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                    <HistoryOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                    <div>Chọn một ngày để xem dữ liệu xu hướng đã lưu.</div>
                </div>
            ) : (
                <Spin spinning={loading}>
                    <Table
                        rowKey={(r) => r.foodName + (r.lastUpdatedAt ?? '')}
                        loading={false}
                        columns={trendColumns as any}
                        dataSource={data}
                        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20'] }}
                        locale={{ emptyText: 'Không có dữ liệu cho ngày này.' }}
                        scroll={{ x: 1000 }}
                    />
                </Spin>
            )}
        </Card>
    );
}

// ============================================================
// Tab 3 — Instagram
// ============================================================
function InstagramTab() {
    const [data, setData] = useState<InstagramTrendingFood[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchInstagramTrends = async () => {
        const token = getToken();
        if (!token) { message.error('Chưa đăng nhập.'); return; }
        setLoading(true);
        try {
            const res = await fetch(
                `${API_URL}/api/social-media/instagram/trending-foods?limit=${LIMIT}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Lỗi API');
            const body: InstagramTrendingFood[] = await res.json();
            setData(body ?? []);
        } catch {
            message.error('Không thể tải xu hướng Instagram.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInstagramTrends(); }, []);

    const columns = [
        {
            title: 'Hạng',
            dataIndex: 'rank',
            key: 'rank',
            width: 70,
            render: (r: number) => <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{r}</span>,
        },
        {
            title: 'Món ăn / Hashtag',
            key: 'food',
            width: 200,
            render: (record: InstagramTrendingFood) => (
                <Space direction="vertical" size={0}>
                    <Typography.Text strong style={{ fontSize: '1rem' }}>{record.name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: '0.8rem' }}>{record.hashtag}</Typography.Text>
                </Space>
            ),
        },
        {
            title: 'Instagram Score',
            dataIndex: 'score',
            key: 'score',
            width: 140,
            sorter: (a: InstagramTrendingFood, b: InstagramTrendingFood) => b.score - a.score,
            render: (score: number) => <ScoreTag score={Math.round(score)} />,
        },
        {
            title: 'Tương tác (24h / Avg)',
            key: 'engagement',
            width: 200,
            render: (record: InstagramTrendingFood) => (
                <Space direction="vertical" size={0}>
                    <Typography.Text style={{ color: '#1f2937', fontWeight: 600 }}>
                        {record.engagement.recent.toFixed(1)} <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.8rem' }}>/ {record.engagement.average.toFixed(1)}</span>
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
                        {record.engagement.posts24h} bài viết mới
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: 'Tăng trưởng',
            key: 'growth',
            width: 120,
            render: (record: InstagramTrendingFood) => {
                const growth = (record.engagement.growthRate - 1) * 100;
                const color = growth >= 0 ? '#16a34a' : '#ef4444';
                return (
                    <span style={{ color, fontWeight: 700 }}>
                        {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                    </span>
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trendStatus',
            key: 'status',
            width: 140,
            render: (status: string) => {
                let color = 'default';
                if (status.includes('VIRAL')) color = 'volcano';
                else if (status.includes('TRENDING')) color = 'orange';
                else if (status.includes('STABLE')) color = 'green';
                return <Tag color={color} style={{ fontWeight: 600 }}>{status}</Tag>;
            },
        },
        {
            title: 'Cập nhật',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 180,
            render: (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '—',
        },
    ];

    return (
        <div>
            <Card
                title={
                    <Space direction="vertical" size={0}>
                        <Typography.Title level={4} style={{ margin: 0 }}>
                            📸 Xu Hướng Instagram
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            Phân tích hashtag ẩm thực Việt Nam trên Instagram (engagement & growth)
                        </Typography.Text>
                    </Space>
                }
                extra={
                    <Button
                        type="primary"
                        icon={<InstagramOutlined />}
                        onClick={fetchInstagramTrends}
                        loading={loading}
                        style={{ background: '#E1306C', borderColor: '#E1306C' }}
                    >
                        Làm mới Instagram
                    </Button>
                }
                variant="outlined"
            >
                <Table
                    rowKey="id"
                    loading={loading}
                    columns={columns as any}
                    dataSource={data}
                    pagination={false}
                    scroll={{ x: 1000 }}
                />
            </Card>
        </div>
    );
}

// ============================================================
// Page root
// ============================================================
export default function HotTrendsPage() {
    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Tabs
                defaultActiveKey="today"
                size="large"
                items={[
                    {
                        key: 'today',
                        label: (
                            <span>
                                <FireOutlined /> Google Trending
                            </span>
                        ),
                        children: <TodayTab />,
                    },
                    {
                        key: 'instagram',
                        label: (
                            <span>
                                <InstagramOutlined /> Instagram
                            </span>
                        ),
                        children: <InstagramTab />,
                    },
                       {
                        key: 'history',
                        label: (
                            <span>
                                <HistoryOutlined /> Lịch sử
                            </span>
                        ),
                        children: <HistoryTab />,
                    },
                ]}
            />
        </div>
    );
}
