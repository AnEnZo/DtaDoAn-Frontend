'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Row, Col, Button, Modal, App } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import CategoryList, { Category } from '@/components/CategoryList';
import MenuItemList from '@/components/MenuItemList';
import { API_URL } from '@/lib/api/client';
import { getToken } from '@/lib/auth/auth-utils';

// Components
import OrderInfoCard, { OrderDetail } from '@/components/order/OrderInfoCard';
import OrderItemsTable from '@/components/order/OrderItemsTable';
import PaymentSection from '@/components/order/PaymentSection';
import QRScannerModal from '@/components/order/QRScannerModal';
import PaymentResultModal from '@/components/order/PaymentResultModal';

const getFriendlyErrorMessage = async (res: Response, defaultMessage: string): Promise<string> => {
    try {
        const text = await res.text();
        let errorMsg = text;
        try {
            const json = JSON.parse(text);
            errorMsg = json.message || json.error || text;
        } catch {
            // Not JSON
        }
        
        if (!errorMsg) return defaultMessage;

        // Clean up and translate error message
        if (errorMsg.includes('Only served orders can be paid') || errorMsg.includes('Only SERVED orders can be paid')) {
            return 'Chỉ đơn hàng đã phục vụ mới có thể thanh toán';
        }
        if (errorMsg.includes('Order already paid')) {
            return 'Đơn hàng này đã được thanh toán';
        }
        if (errorMsg.includes('Voucher already used')) {
            return 'Mã voucher này đã được sử dụng';
        }
        if (errorMsg.includes('Voucher expired')) {
            return 'Mã voucher đã hết hạn';
        }
        if (errorMsg.includes('Voucher is inactive')) {
            return 'Mã voucher không còn hoạt động';
        }

        // Clean any Java exception class names
        errorMsg = errorMsg.replace(/^(java\.lang\.|IllegalStateException:|NoSuchElementException:)\s*/g, '');

        return errorMsg;
    } catch {
        return defaultMessage;
    }
};

export default function OrderDetailPage() {
    const { message } = App.useApp();
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [selectedCat, setSelectedCat] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Payment State
    const [voucherCode, setVoucherCode] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [paymentGateway, setPaymentGateway] = useState<string>('MOMO'); // MOMO or PAYPAL
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [cardType, setCardType] = useState<string>('ATM'); // ATM or CREDIT
    const [cashierId, setCashierId] = useState<number | null>(null);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [finalAmount, setFinalAmount] = useState<number>(0);
    const [customerCash, setCustomerCash] = useState<number>(0); // Tiền khách đưa
    const [voucherError, setVoucherError] = useState<string | null>(null); // Lỗi voucher

    // Modals & Scanners
    const [scanOpen, setScanOpen] = useState<boolean>(false);
    const [qrOpen, setQrOpen] = useState<boolean>(false);
    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
    const [payUrl, setPayUrl] = useState<string | null>(null);
    const sseRef = useRef<EventSource | null>(null);
    const sseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [successOpen, setSuccessOpen] = useState<boolean>(false);

    // New State for Menu Modal
    const [menuModalOpen, setMenuModalOpen] = useState<boolean>(false);

    const fetchOrder = () => {
        setLoading(true);
        const token = getToken();
        if (!token) return;

        fetch(`${API_URL}/api/orders/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Không lấy được đơn');
                return res.json();
            })
            .then((data: OrderDetail) => {
                setOrder(data);
                if (data.staff?.id) setCashierId(data.staff.id);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    // Lightweight refresh for order items only (doesn't close modals)
    const refreshOrderItems = () => {
        const token = getToken();
        if (!token) return;

        fetch(`${API_URL}/api/orders/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Không lấy được đơn');
                return res.json();
            })
            .then((data: OrderDetail) => {
                // Only update order items, keep modal open
                setOrder(prevOrder => prevOrder ? { ...prevOrder, orderItems: data.orderItems } : data);
            })
            .catch((err) => console.error('Error refreshing items:', err));
    };

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const handleCreateInvoice = () => {
        if (cashierId === null) {
            message.error('Không có ID thu ngân, vui lòng đăng nhập lại');
            return;
        }
        if (!paymentMethod) {
            message.error('Vui lòng chọn phương thức thanh toán');
            return;
        }

        const token = getToken();
        if (!token) return;

        // CARD payment
        if (paymentMethod === 'CARD') {
            // PayPal Flow
            if (paymentGateway === 'PAYPAL') {
                const params = new URLSearchParams();
                params.append('orderId', id!);
                if (voucherCode) params.append('voucherCode', voucherCode);
                params.append('cashierId', cashierId.toString());
                if (phoneNumber) params.append('phoneNumber', phoneNumber);

                fetch(`${API_URL}/api/invoices/create-with-paypal`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Bearer ${token}`,
                    },
                    body: params,
                })
                    .then(async (res) => {
                        if (!res.ok) {
                            const errorMsg = await getFriendlyErrorMessage(res, 'Không thể tạo thanh toán PayPal');
                            throw new Error(errorMsg);
                        }
                        return res.json();
                    })
                    .then((data) => {
                        if (!data.success) {
                            throw new Error(data.message || 'Lỗi tạo thanh toán PayPal');
                        }
                        // Redirect to PayPal approval URL
                        if (data.approvalUrl) {
                            // Generate QR Code for the approval URL
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(data.approvalUrl)}`;
                            setQrImageUrl(qrUrl);
                            setPayUrl(data.approvalUrl);
                            setQrOpen(true);

                            // Start SSE to listen for payment completion
                            startPaymentSse();
                        } else {
                            message.error('Không tìm thấy link thanh toán PayPal');
                        }
                    })
                    .catch((err) => message.error(err?.message || 'Lỗi thanh toán PayPal'));
                return;
            }

            // MoMo Card Flow (Existing)
            const params = new URLSearchParams();
            params.append('orderId', id!);
            if (voucherCode) params.append('voucherCode', voucherCode);
            params.append('cashierId', cashierId.toString());
            params.append('cardType', cardType); // ATM or CREDIT
            if (phoneNumber) params.append('phoneNumber', phoneNumber);

            fetch(`${API_URL}/api/invoices/create-with-card-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${token}`,
                },
                body: params,
            })
                .then(async (res) => {
                    if (!res.ok) {
                        const errorMsg = await getFriendlyErrorMessage(res, 'Không thể tạo hóa đơn thanh toán thẻ');
                        throw new Error(errorMsg);
                    }
                    return res.json();
                })
                .then((data) => {
                    // data = { success, message, invoice, payUrl, deeplink, qrCodeUrl, cardType, momoOrderId }
                    if (!data.success) {
                        throw new Error(data.message || 'Không thể tạo hóa đơn');
                    }
                    const qrUrl = data.qrCodeUrl || null;
                    const link = data.deeplink || data.payUrl || null;
                    const generatedQr = link
                        ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(link)}`
                        : null;
                    setQrImageUrl(qrUrl || generatedQr);
                    setPayUrl(link);
                    setQrOpen(true);

                    // SSE subscription
                    startPaymentSse();
                })
                .catch((err) => message.error(err?.message || 'Không thể tạo hóa đơn thanh toán thẻ'));
            return;
        }

        // CASH or TRANSFER: use original API
        const params = new URLSearchParams();
        params.append('orderId', id!);
        if (voucherCode) params.append('voucherCode', voucherCode);
        params.append('cashierId', cashierId.toString());
        params.append('paymentMethod', paymentMethod);
        if (phoneNumber) params.append('phoneNumber', phoneNumber);

        fetch(`${API_URL}/api/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${token}`,
            },
            body: params,
        })
            .then(async (res) => {
                if (!res.ok) {
                    const errorMsg = await getFriendlyErrorMessage(res, 'Không thể tạo hóa đơn');
                    throw new Error(errorMsg);
                }
                return res.json();
            })
            .then(async (data) => {
                // Backend now returns { invoice, payUrl, deeplink, deeplinkQr }
                const invoice = data.invoice || data;
                // CASH
                if (paymentMethod === 'CASH') {
                    setSuccessOpen(true);
                    return;
                }
                // TRANSFER: show QR directly from response
                if (paymentMethod === 'TRANSFER') {
                    const qrUrl = data.deeplinkQr || data.qrCodeUrl || data.qrCode || null;
                    const link = data.deeplink || data.payUrl || data.shortLink || null;
                    const generatedQr = link
                        ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(link)}`
                        : null;
                    setQrImageUrl(qrUrl || generatedQr);
                    setPayUrl(link);
                    setQrOpen(true);
                    // SSE subscription
                    if (sseRef.current) {
                        sseRef.current.close();
                        sseRef.current = null;
                    }
                    const es = new EventSource(`${API_URL}/api/invoices/sse/order/${id}`);
                    sseRef.current = es;
                    es.addEventListener('paid', () => {
                        setQrOpen(false);
                        es.close();
                        sseRef.current = null;
                        router.push('/dashboard/orders');
                    });
                }
            })
            .catch((err) => message.error(err?.message || 'Không thể tạo hóa đơn'));
    };

    // Serve order (same as button in OrdersPage)
    const serveOrder = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`${API_URL}/api/orders/${id}/serve`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorMsg = await getFriendlyErrorMessage(res, 'Unable to serve order');
                throw new Error(errorMsg);
            }
            fetchOrder();
            message.success('Đã phục vụ đơn hàng');
        } catch (e: any) {
            message.error(e?.message || 'Unable to serve order');
        }
    };

    const handleApplyVoucher = () => {
        if (!voucherCode) {
            setVoucherError('Vui lòng nhập mã voucher');
            return;
        }

        const token = getToken();
        if (!token) return;

        fetch(`${API_URL}/api/invoices/calculate?orderId=${id}&voucherCode=${voucherCode}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    // Try to extract clean error message from JSON body
                    let parsed: { message?: string } | null = null;
                    try {
                        parsed = JSON.parse(text);
                    } catch {
                        parsed = null;
                    }
                    if (parsed?.message) {
                        throw new Error(parsed.message);
                    }
                    // If not JSON, extract message from Java exception
                    const match = text.match(/IllegalStateException:\s*(.+?)(?:\n|$)/);
                    if (match) {
                        throw new Error(match[1].trim());
                    }
                    throw new Error(text || 'Voucher không hợp lệ hoặc đã hết hạn');
                }
                return res.json();
            })
            .then((data) => {
                setDiscountAmount(data.discountAmount);
                setFinalAmount(data.totalAmount);
                setVoucherError(null); // Xóa lỗi khi thành công
                message.success('Áp dụng voucher thành công');
            })
            .catch((err) => {
                // Clean up error message - only show the main message
                let errorMsg = err?.message || 'Voucher không hợp lệ hoặc đã hết hạn';

                // Remove stack trace if present
                if (errorMsg.includes('\n')) {
                    errorMsg = errorMsg.split('\n')[0];
                }

                // Remove Java exception class names
                errorMsg = errorMsg.replace(/^(java\.lang\.|IllegalStateException:|NoSuchElementException:)\s*/g, '');

                setVoucherError(errorMsg.trim());
                setDiscountAmount(0);
                setFinalAmount(0);
            });
    };

    // Close any open payment SSE connection + clear its timeout.
    const closePaymentSse = () => {
        if (sseRef.current) {
            try { sseRef.current.close(); } catch { }
            sseRef.current = null;
        }
        if (sseTimeoutRef.current) {
            clearTimeout(sseTimeoutRef.current);
            sseTimeoutRef.current = null;
        }
    };

    // Subscribe to payment-completion events for this order, with error + timeout
    // handling so the QR modal never hangs forever or leaks the connection.
    const startPaymentSse = () => {
        closePaymentSse();
        const es = new EventSource(`${API_URL}/api/invoices/sse/order/${id}`);
        sseRef.current = es;
        es.addEventListener('paid', () => {
            closePaymentSse();
            setQrOpen(false);
            router.push('/dashboard/orders');
        });
        es.onerror = () => {
            // EventSource auto-reconnects on transient errors; only act once it is
            // definitively closed so we don't reconnect forever silently.
            if (es.readyState === EventSource.CLOSED) {
                closePaymentSse();
                message.error('Mất kết nối theo dõi thanh toán. Vui lòng kiểm tra lại trạng thái đơn hàng.');
            }
        };
        // Safety net: stop waiting after 5 minutes.
        sseTimeoutRef.current = setTimeout(() => {
            closePaymentSse();
            message.warning('Hết thời gian chờ thanh toán. Nếu bạn đã thanh toán, hãy làm mới trang.');
        }, 5 * 60 * 1000);
    };

    useEffect(() => {
        return () => {
            closePaymentSse();
        };
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>;
    if (error || !order) return <div style={{ textAlign: 'center', padding: 20 }}>{error || 'Không có dữ liệu'}</div>;

    // Calculate totals
    const total = order.orderItems.reduce((s, x) => s + (x.menuItem?.price || 0) * x.quantity, 0);

    return (
        <div style={{ padding: 24 }}>
            <Button icon={<LeftOutlined />} onClick={() => router.push('/dashboard/orders')} style={{ marginBottom: 16 }}>
                Quay lại
            </Button>

            <Row gutter={[24, 24]}>
                {/* Left: Order Info */}
                <Col xs={24} lg={14}>
                    <OrderInfoCard
                        order={order}
                        orderId={id}
                        onServe={serveOrder}
                        onAddMenu={() => setMenuModalOpen(true)}
                    />
                    <OrderItemsTable
                        items={order.orderItems}
                        total={total}
                        orderId={id}
                        onUpdate={refreshOrderItems}
                    />
                </Col>

                {/* Right: Payment */}
                <Col xs={24} lg={10}>
                    <PaymentSection
                        voucherCode={voucherCode}
                        setVoucherCode={setVoucherCode}
                        voucherError={voucherError}
                        setVoucherError={setVoucherError}
                        onScanVoucher={() => setScanOpen(true)}
                        onApplyVoucher={handleApplyVoucher}
                        phoneNumber={phoneNumber}
                        setPhoneNumber={setPhoneNumber}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        paymentGateway={paymentGateway}
                        setPaymentGateway={setPaymentGateway}
                        cardType={cardType}
                        setCardType={setCardType}
                        total={total}
                        discountAmount={discountAmount}
                        finalAmount={finalAmount}
                        customerCash={customerCash}
                        setCustomerCash={setCustomerCash}
                        onPay={handleCreateInvoice}
                        orderStatus={order?.status}
                    />
                </Col>
            </Row>

            {/* Menu Modal */}
            <Modal
                title="Thêm món"
                open={menuModalOpen}
                onCancel={() => setMenuModalOpen(false)}
                width={1000}
                footer={null}
                className="menu-modal"
            >
                <Row gutter={[16, 16]}>
                    <Col span={6}>
                        <CategoryList onSelect={setSelectedCat} />
                    </Col>
                    <Col span={18}>
                        {selectedCat ? (
                            <MenuItemList categoryName={selectedCat.name} orderId={id} onChange={refreshOrderItems} />
                        ) : (
                            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                                Vui lòng chọn danh mục để xem món
                            </div>
                        )}
                    </Col>
                </Row>
            </Modal>

            {/* QR Scanner Modal */}
            <QRScannerModal
                open={scanOpen}
                onClose={() => setScanOpen(false)}
                onScan={(code) => {
                    setVoucherCode(code);
                    setScanOpen(false);
                }}
            />

            {/* Payment Result Modal (QR or Success) */}
            <PaymentResultModal
                open={qrOpen || successOpen}
                type={successOpen ? 'SUCCESS' : 'QR'}
                data={{
                    qrImageUrl,
                    payUrl,
                    paymentMethod,
                    paymentGateway
                }}
                onClose={() => {
                    // Closing the QR modal stops waiting for payment (avoids leaking the SSE).
                    closePaymentSse();
                    setQrOpen(false);
                    setSuccessOpen(false);
                    if (successOpen) {
                        router.push('/dashboard/orders');
                    }
                }}
            />
        </div>
    );
}
