'use client';

import React from 'react';
import { Card, Input, Button, Space, Divider, Alert } from 'antd';
import {
    QrcodeOutlined,
    DollarOutlined,
    CreditCardOutlined,
    GlobalOutlined,
} from '@ant-design/icons';

interface PaymentSectionProps {
    voucherCode: string;
    setVoucherCode: (code: string) => void;
    voucherError: string | null;
    setVoucherError: (err: string | null) => void;
    onScanVoucher: () => void;
    onApplyVoucher: () => void;

    phoneNumber: string;
    setPhoneNumber: (phone: string) => void;

    paymentMethod: string;
    setPaymentMethod: (method: string) => void;

    paymentGateway: string;
    setPaymentGateway: (gateway: string) => void;

    cardType: string;
    setCardType: (type: string) => void;

    total: number;
    discountAmount: number;
    finalAmount: number;

    customerCash: number;
    setCustomerCash: (cash: number) => void;

    onPay: () => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
    voucherCode, setVoucherCode, voucherError, setVoucherError, onScanVoucher, onApplyVoucher,
    phoneNumber, setPhoneNumber,
    paymentMethod, setPaymentMethod,
    paymentGateway, setPaymentGateway,
    cardType, setCardType,
    total, discountAmount, finalAmount,
    customerCash, setCustomerCash,
    onPay
}) => {
    const displayTotal = finalAmount > 0 ? finalAmount : total;

    return (
        <Card title="Thanh toán">
            {/* Voucher */}
            <div style={{ marginBottom: 24 }}>
                <div className="text-gray-500 mb-2">Mã giảm giá / Voucher</div>
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        placeholder="Nhập mã voucher"
                        value={voucherCode}
                        onChange={(e) => {
                            setVoucherCode(e.target.value);
                            setVoucherError(null);
                        }}
                        prefix={<QrcodeOutlined style={{ color: '#0c0c0cff', cursor: 'pointer' }} onClick={onScanVoucher} />}
                        status={voucherError ? 'error' : ''}
                    />
                    <Button onClick={onApplyVoucher} style={{ background: '#8b4513', color: 'white', border: 'none' }}>Áp dụng</Button>
                </Space.Compact>
                {voucherError && (
                    <div style={{
                        marginTop: 8,
                        background: '#fee2e2',
                        border: '1px solid #ef4444',
                        borderRadius: 8,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        animation: 'slide Down 0.3s ease-out'
                    }}>
                        <div style={{ fontSize: '1.2rem', lineHeight: 1, color: '#dc2626' }}>⚠️</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Không thể áp dụng voucher</div>
                            <div style={{ fontSize: '0.9rem', color: '#7f1d1d', lineHeight: 1.4 }}>{voucherError}</div>
                        </div>
                        <button
                            onClick={() => setVoucherError(null)}
                            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 0 }}
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            {/* Phone number */}
            <div style={{ marginBottom: 24 }}>
                <div className="text-gray-500 mb-2">Số điện thoại khách hàng (tùy chọn)</div>
                <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Nhập số điện thoại..."
                />
            </div>

            {/* Payment Methods */}
            <div style={{ marginBottom: 24 }}>
                <div className="text-gray-500 mb-3">Phương thức thanh toán</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
                    {/* Cash */}
                    <div
                        onClick={() => setPaymentMethod('CASH')}
                        style={{
                            cursor: 'pointer',
                            border: paymentMethod === 'CASH' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                            borderRadius: 8,
                            padding: 16,
                            textAlign: 'center',
                            background: paymentMethod === 'CASH' ? '#e6f7ff' : 'white',
                        }}
                    >
                        <DollarOutlined style={{ fontSize: 32, color: paymentMethod === 'CASH' ? '#1890ff' : '#999' }} />
                        <div style={{ marginTop: 8 }}>Tiền mặt</div>
                    </div>
                    {/* Transfer */}
                    <div
                        onClick={() => setPaymentMethod('TRANSFER')}
                        style={{
                            cursor: 'pointer',
                            border: paymentMethod === 'TRANSFER' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                            borderRadius: 8,
                            padding: 16,
                            textAlign: 'center',
                            background: paymentMethod === 'TRANSFER' ? '#e6f7ff' : 'white',
                        }}
                    >
                        <QrcodeOutlined style={{ fontSize: 32, color: paymentMethod === 'TRANSFER' ? '#1890ff' : '#999' }} />
                        <div style={{ marginTop: 8 }}>Chuyển khoản</div>
                    </div>
                    {/* Card */}
                    <div
                        onClick={() => setPaymentMethod('CARD')}
                        style={{
                            cursor: 'pointer',
                            border: paymentMethod === 'CARD' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                            borderRadius: 8,
                            padding: 16,
                            textAlign: 'center',
                            background: paymentMethod === 'CARD' ? '#e6f7ff' : 'white',
                        }}
                    >
                        <CreditCardOutlined style={{ fontSize: 32, color: paymentMethod === 'CARD' ? '#1890ff' : '#999' }} />
                        <div style={{ marginTop: 8 }}>Thẻ</div>
                    </div>
                </div>
            </div>

            {/* Card / Online Gateway selection */}
            {paymentMethod === 'CARD' && (
                <div style={{ marginBottom: 24 }}>
                    <div className="text-gray-500 mb-3">Cổng thanh toán</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <div
                            onClick={() => setPaymentGateway('MOMO')}
                            style={{
                                cursor: 'pointer',
                                border: paymentGateway === 'MOMO' ? '2px solid #a50064' : '1px solid #d9d9d9',
                                borderRadius: 8,
                                padding: 12,
                                textAlign: 'center',
                                background: paymentGateway === 'MOMO' ? '#fff0f6' : 'white',
                                color: paymentGateway === 'MOMO' ? '#a50064' : 'inherit',
                                fontWeight: paymentGateway === 'MOMO' ? 'bold' : 'normal',
                            }}
                        >
                            MoMo
                        </div>
                        <div
                            onClick={() => setPaymentGateway('PAYPAL')}
                            style={{
                                cursor: 'pointer',
                                border: paymentGateway === 'PAYPAL' ? '2px solid #003087' : '1px solid #d9d9d9',
                                borderRadius: 8,
                                padding: 12,
                                textAlign: 'center',
                                background: paymentGateway === 'PAYPAL' ? '#e6f7ff' : 'white',
                                color: paymentGateway === 'PAYPAL' ? '#003087' : 'inherit',
                                fontWeight: paymentGateway === 'PAYPAL' ? 'bold' : 'normal',
                            }}
                        >
                            <GlobalOutlined style={{ marginRight: 8 }} />
                            PayPal
                        </div>
                    </div>

                    {/* MoMo Sub-options */}
                    {paymentGateway === 'MOMO' && (
                        <div>
                            <div className="text-gray-500 mb-3">Loại thẻ (MoMo)</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div
                                    onClick={() => setCardType('ATM')}
                                    style={{
                                        cursor: 'pointer',
                                        border: cardType === 'ATM' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                        borderRadius: 8,
                                        padding: 12,
                                        textAlign: 'center',
                                        background: cardType === 'ATM' ? '#e6f7ff' : 'white',
                                    }}
                                >
                                    Thẻ ATM
                                </div>
                                <div
                                    onClick={() => setCardType('CREDIT')}
                                    style={{
                                        cursor: 'pointer',
                                        border: cardType === 'CREDIT' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                        borderRadius: 8,
                                        padding: 12,
                                        textAlign: 'center',
                                        background: cardType === 'CREDIT' ? '#e6f7ff' : 'white',
                                    }}
                                >
                                    Visa/Mastercard
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PayPal Info */}
                    {paymentGateway === 'PAYPAL' && (
                        <Alert
                            message="Thanh toán qua PayPal"
                            description="Bạn sẽ được chuyển hướng đến trang thanh toán của PayPal để hoàn tất giao dịch."
                            type="info"
                            showIcon
                        />
                    )}
                </div>
            )}

            {/* Summary */}
            {paymentMethod && (
                <div>
                    <Divider style={{ margin: '20px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span>Tổng tiền hàng:</span>
                        <strong>{total.toLocaleString()} đ</strong>
                    </div>
                    {discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#52c41a' }}>
                            <span>Giảm giá:</span>
                            <strong>- {discountAmount.toLocaleString()} đ</strong>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 18 }}>
                        <strong>Thanh toán:</strong>
                        <strong style={{ color: '#1890ff' }}>{displayTotal.toLocaleString()} đ</strong>
                    </div>

                    {/* Cash payment calculator */}
                    {paymentMethod === 'CASH' && (
                        <div style={{
                            background: '#fef3e2',
                            border: '1px solid #d4a574',
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 16
                        }}>
                            <div className="text-gray-500 mb-2" style={{ color: '#8b4513' }}>Tính tiền thừa</div>
                            <Input
                                type="number"
                                placeholder="Nhập tiền khách đưa..."
                                value={customerCash || ''}
                                onChange={(e) => setCustomerCash(Number(e.target.value))}
                                style={{ marginBottom: 12 }}
                                prefix={<DollarOutlined style={{ color: '#8b4513' }} />}
                                suffix="đ"
                            />
                            <div style={{ fontSize: '0.9rem', color: '#6b5d52' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span>Tiền khách đưa:</span>
                                    <strong>{customerCash.toLocaleString()} đ</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span>Tổng tiền:</span>
                                    <strong>{displayTotal.toLocaleString()} đ</strong>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                paddingTop: 8,
                                borderTop: '1px dashed #d4a574'
                            }}>
                                <span style={{ fontWeight: 600, color: '#8b4513' }}>Tiền thừa:</span>
                                <strong style={{
                                    fontSize: '1.2rem',
                                    color: customerCash >= displayTotal ? '#16a34a' : '#dc2626'
                                }}>
                                    {customerCash >= displayTotal
                                        ? (customerCash - displayTotal).toLocaleString()
                                        : 'Chưa đủ'
                                    }
                                </strong>
                            </div>
                        </div>
                    )}

                    <Button
                        type="primary"
                        size="large"
                        block
                        onClick={onPay}
                        disabled={!paymentMethod || (paymentMethod === 'CASH' && customerCash < displayTotal)}
                    >
                        Thanh toán {displayTotal.toLocaleString()} đ
                    </Button>
                </div>
            )}
        </Card>
    );
};

export default PaymentSection;
