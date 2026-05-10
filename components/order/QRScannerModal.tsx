'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerModalProps {
    open: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ open, onClose, onScan }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    const startScan = async () => {
        setScanError(null);
        try {
            if (scannerRef.current) {
                try {
                    await scannerRef.current.clear();
                } catch { }
                scannerRef.current = null;
            }
            const config: any = { fps: 10, qrbox: 250, rememberLastUsedCamera: true };
            const scanner = new Html5QrcodeScanner('qr-reader', config, false);
            scannerRef.current = scanner;
            scanner.render(
                (decodedText: string) => {
                    if (decodedText) {
                        onScan(decodedText);
                    }
                },
                (_error: any) => {
                    // ignore scan errors
                },
            );
        } catch (e: any) {
            console.error('QR init error:', e);
            setScanError(e?.message || 'Không thể khởi tạo trình quét QR.');
        }
    };

    const stopScan = async () => {
        try {
            if (scannerRef.current) {
                await scannerRef.current.clear();
            }
        } catch { }
        scannerRef.current = null;
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <QrcodeOutlined style={{ fontSize: 24, color: '#8b4513' }} />
                    <span>Quét mã QR Voucher</span>
                </div>
            }
            open={open}
            onCancel={onClose}
            afterOpenChange={(isOpen) => {
                if (isOpen) setTimeout(() => startScan(), 0);
                else stopScan();
            }}
            footer={null}
        >
            <div id="qr-reader" style={{ width: '100%' }}></div>
            {scanError && <div style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>{scanError}</div>}
        </Modal>
    );
};

export default QRScannerModal;
