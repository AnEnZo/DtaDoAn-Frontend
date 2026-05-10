'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api/client';

interface ResetReq {
    username: string;
    otp: string;
    newPassword: string;
}

export default function ResetPasswordEmailPage() {
    const [form, setForm] = useState<ResetReq>({ username: '', otp: '', newPassword: '' });
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { username, otp, newPassword } = form;
        if (!username || !otp || !newPassword) {
            setMessage('Vui lòng điền đầy đủ thông tin');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Đặt lại mật khẩu thất bại');
            setMessage(data.message);
            // Chuyển về login sau 2s
            setTimeout(() => router.push('/'), 2000);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6"
            style={{
                background: 'linear-gradient(135deg, #D2691E 0%, #CD853F 50%, #DEB887 100%)',
            }}
        >
            <div className="w-full max-w-md mx-auto" style={{ maxWidth: '420px' }}>
                <div
                    className="rounded-3xl shadow-2xl p-10"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '20px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                        padding: '2.5rem',
                    }}
                >
                    <h3 className="text-center text-xl font-semibold mb-6">Đặt lại mật khẩu</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-800"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="Nhập username"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="otp" className="block text-gray-700 text-sm font-medium mb-2">
                                OTP
                            </label>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-800"
                                value={form.otp}
                                onChange={handleChange}
                                placeholder="Nhập mã OTP"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-gray-700 text-sm font-medium mb-2">
                                Mật khẩu mới
                            </label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-800"
                                value={form.newPassword}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu mới"
                                disabled={loading}
                            />
                        </div>
                        {message && (
                            <div
                                className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg p-3 text-sm"
                                role="alert"
                            >
                                {message}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="w-full text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            style={{
                                background: 'linear-gradient(to right, #f97316, #ea580c)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 20px rgba(234, 88, 12, 0.35)',
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Xác nhận đặt lại'}
                        </button>
                    </form>
                    <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                        <Link
                            href="/"
                            className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
                        >
                            ← Quay lại Đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
