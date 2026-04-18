'use client';

import React from 'react';
import { Modal, Button, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

interface PaymentResultModalProps {
    open: boolean;
    type: 'QR' | 'SUCCESS';
    data?: {
        qrImageUrl?: string | null;
        payUrl?: string | null;
        paymentMethod?: string;
        paymentGateway?: string;
    };
    onClose: () => void;
}

const PaymentResultModal: React.FC<PaymentResultModalProps> = ({ open, type, data, onClose }) => {
    if (type === 'SUCCESS') {
        return (
            <Modal open={open} footer={null} onCancel={onClose} centered width={400}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
                    <Typography.Title level={3} style={{ margin: 0 }}>
                        Thanh toán thành công!
                    </Typography.Title>
                    <Typography.Text type="secondary">Đơn hàng đã được thanh toán bằng tiền mặt.</Typography.Text>
                    <div style={{ marginTop: 24 }}>
                        <Button type="primary" size="large" onClick={onClose}>
                            Hoàn tất
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    // QR Modal (MoMo / Transfer / PayPal)
    const isCard = data?.paymentMethod === 'CARD';
    const isPayPal = data?.paymentGateway === 'PAYPAL';

    let title = 'Chuyển khoản ngân hàng';
    let btnText = 'Mở ứng dụng ngân hàng';
    let logoSrc = '';
    let headerStyle = {};
    let btnClass = 'momo-btn';

    if (isPayPal) {
        title = 'Thanh toán PayPal';
        btnText = 'Mở PayPal';
        logoSrc = 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg';
        headerStyle = { color: '#003087' };
        btnClass = ''; // Use default primary button or custom class
    } else if (isCard) {
        title = 'Thanh toán MoMo';
        btnText = 'Mở ứng dụng MoMo';
        logoSrc = 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png';
    }

    return (
        <Modal
            open={open}
            footer={null}
            onCancel={onClose}
            centered
            className={isPayPal ? '' : "momo-modal"}
            width={400}
            title={
                <div className={isPayPal ? '' : "momo-header"} style={isPayPal ? { display: 'flex', alignItems: 'center', ...headerStyle } : {}}>
                    {logoSrc && (
                        <img
                            src={logoSrc}
                            alt="Logo"
                            style={{ height: 24, marginRight: 8, filter: (isCard || isPayPal) ? 'none' : 'grayscale(100%)' }}
                        />
                    )}
                    <span>{title}</span>
                </div>
            }
        >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="momo-qr-wrap">
                    {data?.qrImageUrl ? (
                        <img src={data.qrImageUrl} alt="QR Code" style={{ width: '100%', borderRadius: 8 }} />
                    ) : (
                        <div style={{ padding: 40 }}>Đang tạo mã QR...</div>
                    )}
                </div>
                <div style={{ marginTop: 24 }}>
                    <Typography.Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                        Quét mã để thanh toán
                    </Typography.Text>
                    {data?.payUrl && (
                        <Button
                            type="primary"
                            className={btnClass}
                            style={isPayPal ? { background: '#003087', borderColor: '#003087' } : {}}
                            size="large"
                            block
                            onClick={() => window.open(data.payUrl!, '_blank')}
                        >
                            {btnText}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default PaymentResultModal;
