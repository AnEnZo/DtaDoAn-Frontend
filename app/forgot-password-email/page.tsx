'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { API_URL } from '@/lib/api/client';

export default function ForgotPasswordEmailPage() {
    const [username, setUsername] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            setMessage('Username không được để trống');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi gửi OTP');
            setMessage(data.message);
            // Chuyển sang trang nhập OTP sau 2s
            setTimeout(() => router.push('/reset-password-email'), 2000);
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
                    <div className="text-center mb-6">
                        <Image
                            src="/logoTheCoffeHouse.png"
                            alt="The Coffee House"
                            width={220}
                            height={100}
                            style={{ margin: '0 auto', display: 'block' }}
                            priority
                        />
                    </div>

                    <h3 className="text-center text-xl font-semibold mb-4">Quên mật khẩu</h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '12px',
                                    color: '#1f2937',
                                    backgroundColor: '#ffffff',
                                }}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nhập username"
                                disabled={loading}
                            />
                        </div>

                        {message && (
                            <div className="text-center p-3 rounded-lg text-sm bg-blue-100 text-blue-700">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            style={{
                                background: 'linear-gradient(to right, #f97316, #ea580c)',
                                border: 'none',
                                padding: '0.75rem 1rem',
                                fontFamily: 'inherit',
                                borderRadius: '12px',
                                boxShadow: '0 10px 20px rgba(234, 88, 12, 0.35)',
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Đang gửi...' : 'Gửi OTP qua Email'}
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
