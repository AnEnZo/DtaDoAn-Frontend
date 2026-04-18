'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { API_URL } from '@/lib/api/client';

export default function RegisterPage() {
    const [displayName, setDisplayName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const router = useRouter();

    const register = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName, username, email, phoneNumber, password }),
            });
            if (res.status === 201) {
                alert('User registered successfully!');
                router.push('/');
            } else {
                const errorMsg = await res.text();
                throw new Error(errorMsg);
            }
        } catch (err: any) {
            alert(err.message);
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
                        <h1
                            className="text-3xl font-bold text-gray-800 mb-2"
                            style={{ fontSize: '1.875rem', lineHeight: '2.25rem' }}
                        >
                            Tạo tài khoản
                        </h1>
                        <p className="text-gray-600 text-sm">Nhập thông tin bên dưới để bắt đầu</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="displayName" className="block text-gray-700 text-sm font-medium mb-2">
                                Tên hiển thị
                            </label>
                            <input
                                id="displayName"
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
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Nhập tên hiển thị"
                            />
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-2">
                                Tên đăng nhập
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
                                placeholder="Chọn tên đăng nhập"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '12px',
                                    color: '#1f2937',
                                    backgroundColor: '#ffffff',
                                }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Nhập email"
                            />
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-medium mb-2">
                                Số điện thoại
                            </label>
                            <input
                                id="phoneNumber"
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
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Nhập số điện thoại"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '12px',
                                    color: '#1f2937',
                                    backgroundColor: '#ffffff',
                                }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Tạo mật khẩu"
                            />
                        </div>

                        <button
                            className="w-full text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg"
                            style={{
                                background: 'linear-gradient(to right, #f97316, #ea580c)',
                                border: 'none',
                                padding: '0.75rem 1rem',
                                fontFamily: 'inherit',
                                borderRadius: '12px',
                                boxShadow: '0 10px 20px rgba(234, 88, 12, 0.35)',
                            }}
                            onClick={register}
                        >
                            Đăng ký
                        </button>

                        <div className="text-center text-sm text-gray-600">
                            Đã có tài khoản?{' '}
                            <Link
                                href="/"
                                className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
                            >
                                Đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
