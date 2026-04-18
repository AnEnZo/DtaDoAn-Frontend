'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function OAuth2RedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            login(token);
            router.push('/home');
        } else {
            router.push('/');
        }
    }, [searchParams, login, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl">Đang xử lý đăng nhập...</div>
        </div>
    );
}
