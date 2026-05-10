'use client';

import React, { useEffect, useState } from 'react';
import { Card, Space, Typography, Radio, InputNumber, Select, Row, Col } from 'antd';
import {
    DollarOutlined,
    ShoppingOutlined,
    LineChartOutlined,
} from '@ant-design/icons';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

interface RevenueData {
    label: string;
    revenue: number;
}

export default function RevenuePage() {
    const [mode, setMode] = useState<'year' | 'month'>('year');
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [data, setData] = useState<RevenueData[]>([]);
    const [pmCounts, setPmCounts] = useState<Array<{ name: string; value: number; method: string }>>([]);
    const [totalOrders, setTotalOrders] = useState<number>(0);

    // Cafe color scheme
    const COLORS = {
        CASH: '#8b4513',       // Saddle Brown
        TRANSFER: '#cd853f',   // Peru
        CARD: '#deb887',       // Burlywood
    };

    const fetchYearData = async () => {
        const token = getToken();
        if (!token) return;

        const results: RevenueData[] = [];
        for (let m = 1; m <= 12; m++) {
            try {
                const response = await fetch(`${API_URL}/api/revenues/month?month=${m}&year=${year}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const revenue = await response.json();
                results.push({ label: `Tháng ${m}`, revenue: Number(revenue) });
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu tháng', m, error);
                results.push({ label: `Tháng ${m}`, revenue: 0 });
            }
        }
        setData(results);
    };

    const labelFor = (m: string) => {
        switch (m) {
            case 'CASH': return 'Tiền mặt';
            case 'TRANSFER': return 'Chuyển khoản';
            case 'CARD': return 'Thẻ tín dụng';
            default: return m;
        }
    };

    const fetchPaymentCounts = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const start = mode === 'year' ? `${year}-01-01` : `${year}-${String(month).padStart(2, '0')}-01`;
            const end = (() => {
                if (mode === 'year') return `${year}-12-31`;
                const d = new Date(year, month, 0);
                return `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })();

            const res = await fetch(`${API_URL}/api/revenues/payment-method/counts?start=${start}&end=${end}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const rows: Array<{ paymentMethod: string; count: number }> = await res.json();
            const mapped = (rows || []).map((r) => ({
                name: labelFor(r.paymentMethod),
                value: Number(r.count),
                method: r.paymentMethod,
            }));
            const total = mapped.reduce((s, x) => s + x.value, 0);
            setPmCounts(mapped);
            setTotalOrders(total);
        } catch (e) {
            console.error('Lỗi khi lấy số lượng đơn theo phương thức:', e);
            setPmCounts([]);
            setTotalOrders(0);
        }
    };

    const fetchMonthData = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/revenues/daily?month=${month}&year=${year}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const rawData = await response.json();
            const mapped: RevenueData[] = rawData.map((d: any) => {
                const day = new Date(d.date).getDate();
                return { label: `Ngày ${day}`, revenue: d.amount };
            });
            setData(mapped);
        } catch (error) {
            console.error('❌ Lỗi khi gọi API /daily:', error);
            setData([]);
        }
    };

    useEffect(() => {
        if (mode === 'year') fetchYearData();
        else fetchMonthData();
        fetchPaymentCounts();
    }, [mode, year, month]);

    // Calculate statistics
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; subtitle: string; color: string }> =
        ({ icon, title, value, subtitle, color }) => (
            <Card
                style={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    background: '#fff'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        background: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: color
                    }}>
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

    const CustomBar = (props: any) => {
        const { fill, x, y, width, height } = props;
        return (
            <g>
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b4513" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#cd853f" stopOpacity={0.9} />
                    </linearGradient>
                </defs>
                <rect x={x} y={y} width={width} height={height} fill="url(#barGradient)" rx={6} />
            </g>
        );
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <Typography.Title level={3} style={{ margin: 0, color: '#1f2937' }}>
                            Báo Cáo Doanh Thu
                        </Typography.Title>
                        <Typography.Text type="secondary">Thống kê và phân tích doanh thu</Typography.Text>
                    </div>
                    <Space wrap>
                        <Radio.Group
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            buttonStyle="solid"
                        >
                            <Radio.Button value="year">Theo năm</Radio.Button>
                            <Radio.Button value="month">Theo tháng</Radio.Button>
                        </Radio.Group>
                        <InputNumber min={2000} max={2100} value={year} onChange={(v) => setYear(Number(v))} />
                        {mode === 'month' && (
                            <Select
                                value={month}
                                onChange={(v) => setMonth(v)}
                                options={Array.from({ length: 12 }, (_, i) => ({
                                    label: `Tháng ${i + 1}`,
                                    value: i + 1,
                                }))}
                                style={{ width: 120 }}
                            />
                        )}
                    </Space>
                </div>

                {/* Statistics Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={8}>
                        <StatCard
                            icon={<DollarOutlined />}
                            title="Tổng Doanh Thu"
                            value={`${totalRevenue.toLocaleString()} đ`}
                            subtitle={mode === 'year' ? `Năm ${year}` : `Tháng ${month}/${year}`}
                            color="#8b4513"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <StatCard
                            icon={<ShoppingOutlined />}
                            title="Tổng Đơn Hàng"
                            value={totalOrders.toString()}
                            subtitle="Đơn đã thanh toán"
                            color="#cd853f"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <StatCard
                            icon={<LineChartOutlined />}
                            title="Trung Bình / Đơn"
                            value={`${avgOrderValue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ`}
                            subtitle="Giá trị trung bình"
                            color="#deb887"
                        />
                    </Col>
                </Row>

                {/* Charts Section */}
                <Row gutter={[16, 16]}>
                    {/* Pie Chart */}
                    <Col xs={24} lg={10}>
                        <Card
                            title={<span style={{ color: '#1f2937', fontWeight: 600 }}>Phân Bổ Phương Thức Thanh Toán</span>}
                            style={{
                                borderRadius: 12,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                height: '100%'
                            }}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pmCounts}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={(entry: any) => {
                                            const v = Number(entry?.value ?? 0);
                                            const pct = totalOrders > 0 ? Math.round((v / totalOrders) * 100) : 0;
                                            return `${pct}%`;
                                        }}
                                    >
                                        {pmCounts.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.method === 'CASH' ? COLORS.CASH : entry.method === 'TRANSFER' ? COLORS.TRANSFER : COLORS.CARD}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: any, n: any) => [`${v} đơn`, n]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>

                    {/* Bar Chart */}
                    <Col xs={24} lg={14}>
                        <Card
                            title={<span style={{ color: '#1f2937', fontWeight: 600 }}>Biểu Đồ Doanh Thu</span>}
                            style={{
                                borderRadius: 12,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={data}
                                    onClick={(e) => {
                                        if (mode === 'year' && e?.activeLabel) {
                                            const matched = (e.activeLabel as string).match(/Tháng (\d+)/);
                                            if (matched) {
                                                const clickedMonth = parseInt(matched[1]);
                                                setMonth(clickedMonth);
                                                setMode('month');
                                            }
                                        }
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: 12 }} />
                                    <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value: any) => [`${value.toLocaleString()} đ`, 'Doanh thu']}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                                    />
                                    <Bar dataKey="revenue" shape={<CustomBar />} name="Doanh thu" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            {mode === 'year' && (
                                <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                                    💡 Click vào cột để xem chi tiết theo tháng
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
