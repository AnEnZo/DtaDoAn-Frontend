'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Table,
    Space,
    Button,
    InputNumber,
    Popconfirm,
    Alert,
    Typography,
    Tag,
    DatePicker,
    Pagination,
    App,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { apiGet, apiDelete, request } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';
import { getToken, parseJwt } from '@/lib/auth/auth-utils';
import { useAuth } from '@/lib/hooks/useAuth';

interface Invoice {
    id: number;
    discountAmount: number;
    originalAmount: number;
    paymentMethod: string;
    paymentTime: string;
    totalAmount: number;
    cashierId: number | null;
    orderId: number | null;
    voucherId: number | null;
    tableName: string | null;
    status?: string;
}

interface ApiResponse {
    content: Invoice[];
    pageable: any;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export default function InvoicePage() {
    const { message } = App.useApp();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoiceId, setInvoiceId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [isFiltering, setIsFiltering] = useState(false);

    const { user } = useAuth();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;

    const mapInvoiceData = (item: any): Invoice => ({
        id: item.id,
        discountAmount: item.discountAmount ?? item.discount_amount ?? 0,
        originalAmount: item.originalAmount ?? item.original_amount ?? 0,
        paymentMethod: item.paymentMethod ?? item.payment_method ?? '',
        paymentTime: item.paymentTime ?? item.payment_time ?? '',
        totalAmount: item.totalAmount ?? item.total_amount ?? 0,
        orderId: item.order?.id ?? null,
        voucherId: item.voucher?.id ?? null,
        cashierId: item.order?.staff?.id ?? null,
        tableName: item.order?.table?.name ?? null,
        status: item.status ?? item.invoiceStatus ?? undefined,
    });

    const fetchInvoices = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const url = (() => {
                if (isFiltering && range && range[0] && range[1]) {
                    const start = range[0].format('YYYY-MM-DD');
                    const end = range[1].format('YYYY-MM-DD');
                    return `/api/invoices/filter?start=${start}&end=${end}&page=${page}&size=${size}&sortBy=paymentTime&sortDir=desc`;
                }
                return `/api/invoices?page=${page}&size=${size}&sortBy=paymentTime&sortDir=desc&_=${new Date().getTime()}`;
            })();

            const data = await apiGet<ApiResponse>(url);
            const invoiceData = data.content || [];
            const formatted = invoiceData.map(mapInvoiceData);
            setInvoices(formatted);
            setTotalPages(data.totalPages || 0);
            setError(null);
        } catch (error: any) {
            console.error('Lỗi khi lấy hóa đơn:', error);
            setError(getErrorMessage(error, 'Không thể tải danh sách hóa đơn.'));
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [
        page,
        isFiltering,
        JSON.stringify(range && [range[0]?.format?.('YYYY-MM-DD'), range[1]?.format?.('YYYY-MM-DD')]),
    ]);

    const fetchInvoiceById = async (id: number) => {
        const token = getToken();
        if (!token) return;

        try {
            const data = await apiGet<any>(`/api/invoices/${id}`);
            const formatted = mapInvoiceData(data);
            setInvoices([formatted]);
            setError(null);
        } catch (error: any) {
            console.error('Không tìm thấy hóa đơn:', error);
            setInvoices([]);
            setError(getErrorMessage(error, `Không tìm thấy hóa đơn với ID: ${id}`));
        }
    };

    const exportExcel = async (id: number) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await request<Response>(`/api/invoices/${id}/export/excel`, { parseJson: false });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Lỗi khi xuất Excel:', error);
            message.error(getErrorMessage(error, 'Lỗi khi xuất Excel'));
        }
    };

    const exportWord = async (id: number) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await request<Response>(`/api/invoices/${id}/export/word`, { parseJson: false });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${id}.docx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('Lỗi khi xuất Word:', error);
            message.error(getErrorMessage(error, 'Lỗi khi xuất Word'));
        }
    };

    const deleteInvoice = async (id: number) => {
        if (!window.confirm(`Bạn có chắc muốn xóa hóa đơn #${id}?`)) return;
        const token = getToken();
        if (!token) return;

        try {
            await apiDelete(`/api/invoices?invoiceId=${id}`);

            setInvoices((prev) => prev.filter((invoice) => invoice.id !== id));
            message.success('Xóa hóa đơn thành công');
        } catch (error: any) {
            console.error('Lỗi khi xóa hóa đơn:', error);
            message.error(getErrorMessage(error, 'Không thể xóa hóa đơn'));
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'Giá gốc',
            dataIndex: 'originalAmount',
            key: 'originalAmount',
            render: (v: number) => v.toLocaleString(),
        },
        {
            title: 'Giảm giá',
            dataIndex: 'discountAmount',
            key: 'discountAmount',
            render: (v: number) => v.toLocaleString(),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (v: number) => <Typography.Text strong>{v.toLocaleString()}</Typography.Text>,
        },
        {
            title: 'Phương thức',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (m: string) => <Tag>{m}</Tag>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (s?: string) => {
                const color =
                    s === 'PAID'
                        ? 'green'
                        : s === 'PENDING'
                            ? 'orange'
                            : s === 'CANCELED'
                                ? 'red'
                                : s === 'REFUNDED'
                                    ? 'purple'
                                    : 'default';
                return <Tag color={color}>{s || '-'}</Tag>;
            },
        },
        {
            title: 'Thời gian',
            dataIndex: 'paymentTime',
            key: 'paymentTime',
            render: (t: string) => new Date(t).toLocaleString(),
        },
        { title: 'Cashier ID', dataIndex: 'cashierId', key: 'cashierId' },
        { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
        { title: 'Voucher ID', dataIndex: 'voucherId', key: 'voucherId' },
        { title: 'Tên bàn', dataIndex: 'tableName', key: 'tableName' },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: any, r: Invoice) => (
                <Space>
                    <Button
                        onClick={() => exportExcel(r.id)}
                        className="btn-excel"
                        style={{
                            backgroundColor: '#16a34a',
                            borderColor: '#16a34a',
                            color: '#fff',
                        }}
                    >
                        Excel
                    </Button>
                    <Button
                        onClick={() => exportWord(r.id)}
                        className="btn-word"
                        style={{
                            backgroundColor: '#2563eb',
                            borderColor: '#2563eb',
                            color: '#fff',
                        }}
                    >
                        Word
                    </Button>
                    {isAdmin && (
                        <Popconfirm
                            title={`Xóa hóa đơn #${r.id}?`}
                            onConfirm={() => deleteInvoice(r.id)}
                            okButtonProps={{ danger: true }}
                            okText="Xóa"
                        >
                            <Button danger>Xóa</Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Card
            title={
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Danh sách Hóa đơn
                </Typography.Title>
            }
            extra={
                <Space>
                    <InputNumber
                        placeholder="Nhập ID hóa đơn"
                        value={invoiceId as number | null}
                        onChange={(v) => setInvoiceId(v == null ? null : Number(v))}
                        style={{ width: 180 }}
                    />
                    <Button onClick={() => invoiceId && fetchInvoiceById(invoiceId)}>Tìm</Button>
                    <DatePicker.RangePicker
                        value={range as any}
                        onChange={(vals) => setRange(vals as any)}
                        allowClear
                    />
                    <Button
                        onClick={() => {
                            setPage(0);
                            setIsFiltering(true);
                            fetchInvoices();
                        }}
                    >
                        Lọc
                    </Button>
                    <Button
                        onClick={() => {
                            setInvoiceId(null);
                            setRange(null);
                            setIsFiltering(false);
                            setPage(0);
                            fetchInvoices();
                        }}
                    >
                        Reset
                    </Button>
                </Space>
            }
        >
            {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}
            <Table
                rowKey={(r) => String(r.id)}
                dataSource={invoices}
                columns={columns as any}
                pagination={false}
            />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <Pagination
                    current={page + 1}
                    total={totalPages * size}
                    pageSize={size}
                    onChange={(p) => setPage(p - 1)}
                    showSizeChanger={false}
                />
            </div>
        </Card>
    );
}
