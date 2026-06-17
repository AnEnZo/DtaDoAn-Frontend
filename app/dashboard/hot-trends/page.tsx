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
    DatabaseOutlined,
} from '@ant-design/icons';
import { apiGet, apiPost } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';
import { getToken } from '@/lib/auth/auth-utils';
import type { Dayjs } from 'dayjs';

const GEO = 'VN';
const LIMIT = 20;

interface FoodTrendItem {
    id: number;
    food_name: string;
    food_type: string | null;
    hotness_score: number | null;
    search_volume: number | null;
    increase_percentage: number | null;
    related_keywords: string[] | null;
    reasoning: string | null;
    status: string | null;
    last_updated_at: string | null;
    first_seen_at: string | null;
}

interface PageMetadata {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
}

interface PagedTrends<T = FoodTrendItem> {
    content: T[];
    pagination: PageMetadata;
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

interface RawTrendItem {
    id: number;
    query: string;
    search_volume: number | string | null;
    increase_percentage: number | string | null;
    categories: string | string[] | null;
    trend_breakdown: string | string[] | null;
    location: string | null;
    fetched_date: string | null;
    fetched_at: string | null;
}

interface RawTrendsResponse {
    totalItems: number;
    geo: string;
    date: string | null;
    dataSource: string | null;
    pagedTrends: PagedTrends<RawTrendItem>;
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
    if (score >= 70) return <Tag color="red">{score}</Tag>;
    if (score >= 40) return <Tag color="orange">{score}</Tag>;
    return <Tag color="gold">{score}</Tag>;
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
        dataIndex: 'food_name',
        key: 'food_name',
        width: 220,
        render: (text: string) => <strong>{text}</strong>,
    },
    {
        title: 'Trend Score',
        dataIndex: 'hotness_score',
        key: 'hotness_score',
        width: 130,
        sorter: (a: FoodTrendItem, b: FoodTrendItem) => (b.hotness_score ?? 0) - (a.hotness_score ?? 0),
        render: (score: number | null) => <ScoreTag score={score} />,
    },
    {
        title: 'Search Volume',
        dataIndex: 'search_volume',
        key: 'search_volume',
        width: 150,
        sorter: (a: FoodTrendItem, b: FoodTrendItem) => (b.search_volume ?? 0) - (a.search_volume ?? 0),
        render: (v: number | null) =>
            v != null ? (
                <span style={{ fontWeight: 600 }}>{v.toLocaleString('vi-VN')}</span>
            ) : (
                <span style={{ color: '#999' }}>—</span>
            ),
    },
    {
        title: 'Tăng trưởng',
        dataIndex: 'increase_percentage',
        key: 'increase_percentage',
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
        dataIndex: 'last_updated_at',
        key: 'last_updated_at',
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
            const body = await apiGet<FoodTrendsResponse>(
                `/api/serpapi/food-trends/today?geo=${GEO}&limit=${LIMIT}`
            );
            setData(body.trends ?? []);
        } catch (err) {
            message.error(getErrorMessage(err, 'Không thể tải dữ liệu hôm nay.'));
        } finally {
            setLoading(false);
        }
    };

    const runPipeline = async () => {
        const token = getToken();
        if (!token) { message.error('Chưa đăng nhập.'); return; }
        setPipelineRunning(true);
        try {
            const result = await apiPost<PipelineResult>(
                `/api/serpapi/food-trends/pipeline?geo=${GEO}&hours=24`
            );
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
        } catch (err) {
            message.error(getErrorMessage(err, 'Chạy pipeline thất bại. Vui lòng thử lại.'));
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
                    rowKey={(r) => (r.id ?? r.food_name ?? '') + (r.last_updated_at ?? '')}
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
    const [data, setData] = useState<FoodTrendItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const PAGE_SIZE = 10;

    const fetchHistory = async (page = 1) => {
        const token = getToken();
        if (!token) { message.error('Chưa đăng nhập.'); return; }
        setLoading(true);
        try {
            const body = await apiGet<PagedTrends>(
                `/api/serpapi/food-trends/history?geo=${GEO}&page=${page}&limit=${PAGE_SIZE}`
            );
            setData(body.content ?? []);
            setTotalItems(body.pagination?.total_items ?? 0);
            setTotalPages(body.pagination?.total_pages ?? 0);
            setCurrentPage(page);
            if ((body.content ?? []).length === 0) {
                message.info('Chưa có dữ liệu xu hướng nào trong database.');
            }
        } catch (err) {
            message.error(getErrorMessage(err, 'Không thể tải dữ liệu lịch sử.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(1); }, []);

    return (
        <Card
            title={
                <Space direction="vertical" size={0}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        📅 Lịch Sử Hot Trend
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Tất cả xu hướng ẩm thực đã lưu · Khu vực: {GEO} · {totalItems} records
                    </Typography.Text>
                </Space>
            }
            extra={
                <Button
                    icon={<ReloadOutlined />}
                    onClick={() => fetchHistory(currentPage)}
                    disabled={loading}
                >
                    Làm mới
                </Button>
            }
            variant="outlined"
        >
            <Spin spinning={loading}>
                <Table
                    rowKey={(r) => (r.id ?? r.food_name ?? '') + (r.last_updated_at ?? '')}
                    columns={trendColumns as any}
                    dataSource={data}
                    loading={false}
                    pagination={{
                        current: currentPage,
                        pageSize: PAGE_SIZE,
                        total: totalItems,
                        showSizeChanger: false,
                        showTotal: (total: number) => `Tổng ${total} records`,
                        onChange: (page) => fetchHistory(page),
                    }}
                    locale={{ emptyText: 'Chưa có dữ liệu xu hướng nào trong database.' }}
                    scroll={{ x: 1000 }}
                />
            </Spin>
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
            const body = await apiGet<InstagramTrendingFood[]>(
                `/api/social-media/instagram/trending-foods?limit=${LIMIT}`
            );
            setData(body ?? []);
        } catch (err) {
            message.error(getErrorMessage(err, 'Không thể tải xu hướng Instagram.'));
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
// Tab 4 — Raw Data (Before Llama)
// ============================================================
function RawDataTab() {
    const [data, setData] = useState<RawTrendItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [searched, setSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const PAGE_SIZE = 10;

    const fetchRawTrends = async (date?: Dayjs, page = 1) => {
        const token = getToken();
        if (!token) { message.error('Chưa đăng nhập.'); return; }
        setLoading(true);
        setSearched(true);
        try {
            const dateStr = date ? date.format('YYYY-MM-DD') : '';
            const url = dateStr
                ? `/api/serpapi/food-trends/raw?geo=${GEO}&date=${dateStr}&page=${page}&limit=${PAGE_SIZE}`
                : `/api/serpapi/food-trends/raw?geo=${GEO}&page=${page}&limit=${PAGE_SIZE}`;

            const body = await apiGet<RawTrendsResponse>(url);
            const content = body.pagedTrends?.content ?? [];
            setData(content);
            setTotalItems(body.pagedTrends?.pagination?.total_items ?? 0);
            setCurrentPage(page);
            if (content.length === 0) {
                message.info('Chưa có raw data cho ngày này. Bấm "Fetch Raw Data" để lấy dữ liệu từ Google Trends.');
            }
        } catch (err) {
            message.error(getErrorMessage(err, 'Không thể tải raw data.'));
        } finally {
            setLoading(false);
        }
    };

    const handleFetchRawData = async () => {
        const token = getToken();
        if (!token) { message.error('Chưa đăng nhập.'); return; }
        setFetching(true);
        try {
            const result = await apiPost<{ status: string; fetched: number; reason: string | null }>(
                `/api/serpapi/food-trends/fetch?geo=${GEO}&hours=24`
            );
            if (result.status === 'ok') {
                message.success(`Đã fetch ${result.fetched} raw queries từ Google Trends!`);
            } else {
                message.info(result.reason || 'Đã có data cho hôm nay.');
            }
            await fetchRawTrends();
        } catch (err) {
            message.error(getErrorMessage(err, 'Fetch raw data thất bại.'));
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchRawTrends(); }, []);

    const rawColumns = [
        {
            title: '#',
            key: 'index',
            width: 50,
            render: (_: any, __: any, index: number) => (currentPage - 1) * PAGE_SIZE + index + 1,
        },
        {
            title: 'Query',
            dataIndex: 'query',
            key: 'query',
            width: 200,
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: 'Search Volume',
            dataIndex: 'search_volume',
            key: 'search_volume',
            width: 150,
            sorter: (a: RawTrendItem, b: RawTrendItem) => {
                const va = typeof a.search_volume === 'number' ? a.search_volume : parseFloat(String(a.search_volume ?? '0'));
                const vb = typeof b.search_volume === 'number' ? b.search_volume : parseFloat(String(b.search_volume ?? '0'));
                return vb - va;
            },
            render: (v: number | string | null) => {
                if (v == null) return <span style={{ color: '#999' }}>—</span>;
                const num = typeof v === 'number' ? v : parseFloat(String(v));
                if (isNaN(num)) return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{v}</span>;
                return <span style={{ fontWeight: 600 }}>{num.toLocaleString('vi-VN')}</span>;
            },
        },
        {
            title: 'Tăng trưởng',
            dataIndex: 'increase_percentage',
            key: 'increase_percentage',
            width: 120,
            sorter: (a: RawTrendItem, b: RawTrendItem) => {
                const va = typeof a.increase_percentage === 'number' ? a.increase_percentage : parseInt(String(a.increase_percentage ?? '0'));
                const vb = typeof b.increase_percentage === 'number' ? b.increase_percentage : parseInt(String(b.increase_percentage ?? '0'));
                return vb - va;
            },
            render: (v: number | string | null) => {
                if (v == null) return <span style={{ color: '#999' }}>—</span>;
                const num = typeof v === 'number' ? v : parseInt(String(v).replace(/\D/g, ''));
                if (isNaN(num)) return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{v}</span>;
                return <span style={{ color: '#16a34a', fontWeight: 600 }}>+{num}%</span>;
            },
        },
        {
            title: 'Categories',
            dataIndex: 'categories',
            key: 'categories',
            width: 180,
            render: (v: string | string[] | null) => {
                if (!v) return <span style={{ color: '#999' }}>—</span>;
                let items: string[];
                if (Array.isArray(v)) {
                    items = v;
                } else if (v.startsWith('[')) {
                    try { items = JSON.parse(v); } catch { items = String(v).split(',').map(s => s.trim()); }
                } else {
                    items = String(v).split(',').map(s => s.trim());
                }
                if (items.length === 0) return <span style={{ color: '#999' }}>—</span>;
                return <Tag color="blue">{items[0]}</Tag>;
            },
        },
        {
            title: 'Trend Breakdown',
            dataIndex: 'trend_breakdown',
            key: 'trend_breakdown',
            width: 250,
            ellipsis: true,
            render: (v: string | string[] | null) => {
                if (!v) return <span style={{ color: '#999' }}>—</span>;
                let items: string[];
                if (Array.isArray(v)) {
                    items = v;
                } else if (String(v).startsWith('[')) {
                    try { items = JSON.parse(String(v)); } catch { items = String(v).split(',').map(s => s.trim()); }
                } else {
                    items = String(v).split(',').map(s => s.trim());
                }
                const display = items.slice(0, 3).join(', ');
                return (
                    <Typography.Text ellipsis={{ tooltip: items.join(' | ') }} style={{ maxWidth: 240 }}>
                        {display}
                    </Typography.Text>
                );
            },
        },
        {
            title: 'Fetched At',
            dataIndex: 'fetched_at',
            key: 'fetched_at',
            width: 170,
            render: (d: string | null) =>
                d ? new Date(d).toLocaleString('vi-VN') : <span style={{ color: '#999' }}>—</span>,
        },
    ];

    return (
        <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <StatCard
                        icon={<DatabaseOutlined />}
                        title="Tổng Raw Queries"
                        value={totalItems > 0 ? totalItems : data.length}
                        subtitle={searched ? `Hiển thị trang ${currentPage} / ~${Math.ceil((totalItems || data.length) / PAGE_SIZE)}` : 'Trước khi Llama lọc'}
                        color="#6366f1"
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <StatCard
                        icon={<FireOutlined />}
                        title="Geo"
                        value={GEO}
                        subtitle="Khu vực"
                        color="#f59e0b"
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <StatCard
                        icon={<RiseOutlined />}
                        title="Data Source"
                        value="SerpAPI"
                        subtitle={selectedDate ? `Ngày: ${selectedDate.format('DD/MM/YYYY')}` : 'Hôm nay'}
                        color="#10b981"
                    />
                </Col>
            </Row>

            <Card
                title={
                    <Space direction="vertical" size={0}>
                        <Typography.Title level={4} style={{ margin: 0 }}>
                            📊 Raw Data (Trước Llama AI)
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            Dữ liệu thô từ Google Trends — chưa qua bộ lọc Llama AI
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
                            icon={<ReloadOutlined />}
                            onClick={() => fetchRawTrends(selectedDate || undefined, currentPage)}
                            disabled={loading}
                        >
                            Xem
                        </Button>
                        <Button
                            type="primary"
                            icon={<DatabaseOutlined />}
                            onClick={handleFetchRawData}
                            loading={fetching}
                            style={{ background: '#6366f1', borderColor: '#6366f1' }}
                        >
                            Fetch Raw Data
                        </Button>
                    </Space>
                }
                variant="outlined"
            >
                <Spin spinning={loading}>
                    <Table
                        rowKey={(r: RawTrendItem) => (r.id ?? r.query ?? '') + (r.fetched_at ?? '')}
                        columns={rawColumns as any}
                        dataSource={data}
                        loading={loading}
                        pagination={{
                            current: currentPage,
                            pageSize: PAGE_SIZE,
                            total: totalItems,
                            showSizeChanger: false,
                            showTotal: (total: number) => `Tổng ${total} items`,
                            onChange: (page) => fetchRawTrends(selectedDate || undefined, page),
                        }}
                        locale={{
                            emptyText: (
                                <div style={{ padding: '24px 0', color: '#6b7280' }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có raw data</div>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        Bấm <strong>"Fetch Raw Data"</strong> để lấy dữ liệu thô từ Google Trends,
                                        hoặc chọn ngày để xem data đã lưu.
                                    </div>
                                </div>
                            )
                        }}
                        scroll={{ x: 1000 }}
                    />
                </Spin>
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
                    // {
                    //     key: 'instagram',
                    //     label: (
                    //         <span>
                    //             <InstagramOutlined /> Instagram
                    //         </span>
                    //     ),
                    //     children: <InstagramTab />,
                    // },
                    {
                        key: 'raw',
                        label: (
                            <span>
                                <DatabaseOutlined /> Raw Data
                            </span>
                        ),
                        children: <RawDataTab />,
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
