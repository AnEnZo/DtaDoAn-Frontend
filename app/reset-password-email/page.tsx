'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';

interface ResetReq {
    username: string;
    otp: string;
    newPassword: string;
}

interface ResetForm extends ResetReq {
    confirmPassword: string;
}

export default function ResetPasswordEmailPage() {
    const [form, setForm] = useState<ResetForm>({ username: '', otp: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState<boolean>(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { username, otp, newPassword, confirmPassword } = form;
        if (!username || !otp || !newPassword || !confirmPassword) {
            setMessage('Vui lòng điền đầy đủ thông tin');
            setIsError(true);
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage('Mật khẩu nhập lại không khớp!');
            setIsError(true);
            return;
        }
        setLoading(true);
        try {
            const data = await apiPost<{ message?: string }>(
                '/api/auth/reset-password-email',
                { username, otp, newPassword },
                { auth: false }
            );
            setMessage(data?.message || 'Đặt lại mật khẩu thành công');
            setIsError(false);
            // Chuyển về login sau 2s
            setTimeout(() => router.push('/'), 2000);
        } catch (err) {
            setMessage(getErrorMessage(err, 'Đặt lại mật khẩu thất bại'));
            setIsError(true);
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
                        <div>
                            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                                Nhập lại mật khẩu
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-800"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Nhập lại mật khẩu mới"
                                disabled={loading}
                            />
                            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1 font-medium">
                                    Mật khẩu nhập lại không khớp
                                </p>
                            )}
                        </div>
                        {message && (
                            <div
                                className={`p-4 rounded-xl text-sm border transition-all duration-300 ${
                                    isError
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-green-50 text-green-700 border-green-200'
                                }`}
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
