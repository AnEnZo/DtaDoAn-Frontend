'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { API_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface ItemStatsDTO {
    itemName: string;
    quantitySold: number;
    price: string;
    imageUrl: string;
}

interface TopItemsProps {
    topN?: number;
}

const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
};

const SkeletonCard = () => (
    <div style={{ flex: '1 1 calc(33.333% - 16px)', minWidth: 260 }}>
        <div
            className="animate-pulse bg-gray-200"
            style={{
                height: 320,
                borderRadius: 16,
            }}
        />
    </div>
);

const TopItems: React.FC<TopItemsProps> = ({ topN = 3 }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<ItemStatsDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Note: In the original code, it attached token if present.
        // Our apiClient handles this, but here we are using fetch directly to match original logic structure
        // or we can switch to apiClient. Let's stick to fetch with manual header for now to be safe, 
        // or better, just use the token from useAuth if we want to be consistent.
        // However, the original code used sessionStorage. 
        // Let's use the API_URL.

        // Actually, for public data like top items, maybe auth isn't strictly required by backend?
        // The original code sent it if available.

        // Let's use fetch with API_URL.

        // We need to get the token. useAuth provides it via cookies, but we might not need it if the endpoint is public.
        // Assuming it might be public or we just pass what we have.

        // Wait, useAuth doesn't expose the raw token string directly in the return object I designed earlier?
        // Let's check useAuth.ts.
        // It exposes `login`, `logout`, `user`, `roles`. It doesn't expose the raw token string directly 
        // unless we get it from cookies again.
        // But `lib/auth/auth-utils.ts` has `getToken()`.

        // Let's import getToken from auth-utils.
        const token = import('@/lib/auth/auth-utils').then(m => m.getToken());

        // Actually, let's just use the simple fetch for now.

        const fetchItems = async () => {
            try {
                const { getToken } = await import('@/lib/auth/auth-utils');
                const token = getToken();

                const headers: HeadersInit = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const res = await fetch(`${API_URL}/api/revenues/items/top?topN=${topN}`, {
                    headers,
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setItems(data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Không tải được dữ liệu.');
                setLoading(false);
            }
        };

        fetchItems();
    }, [topN]);

    if (loading) {
        return (
            <section
                className="top-items container mx-auto my-8 px-4"
                style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem' }}
            >
                <h2 className="mb-6 text-2xl font-semibold" style={{ textAlign: 'center' }}>
                    Best Seller
                </h2>
                <div
                    style={{
                        display: 'flex',
                        gap: '24px',
                        flexWrap: 'wrap',
                        alignItems: 'stretch',
                        justifyContent: 'space-between',
                    }}
                >
                    {[1, 2, 3].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </section>
        );
    }

    if (error) return <p className="text-red-600" style={{ textAlign: 'center' }}>{error}</p>;

    return (
        <section
            className="top-items container mx-auto my-8 px-4"
            style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem' }}
        >
            <h2 className="mb-6 text-2xl font-semibold text-gradient" style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800 }}>
                Best Seller
            </h2>
            <div
                style={{
                    display: 'flex',
                    gap: '24px',
                    flexWrap: 'wrap',
                    alignItems: 'stretch',
                    justifyContent: 'space-between',
                }}
            >
                {items.map((item, index) => {
                    const rank = index + 1;
                    const suffix = getRankSuffix(rank);

                    return (
                        <div key={item.itemName} style={{ flex: '1 1 calc(33.333% - 16px)', minWidth: 260 }} className="stagger-item">
                            <div
                                className="relative bg-white rounded-2xl h-full overflow-hidden group"
                                style={{
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                }}
                            >
                                <div
                                    className="absolute top-0 left-0 text-black px-3 py-1 rounded-br font-bold"
                                    style={{ zIndex: 1, background: '#FACC15', fontSize: '1.1rem' }}
                                >
                                    {rank}
                                    <sup>{suffix}</sup>
                                </div>

                                <div
                                    style={{ width: '100%', height: 200, overflow: 'hidden', position: 'relative' }}
                                >
                                    <Image
                                        src={item.imageUrl || '/placeholder.png'}
                                        alt={item.itemName}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                                        style={{ objectFit: 'cover', transition: 'transform .4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                        className="group-hover:scale-110"
                                    />

                                    {/* Sold count badge */}
                                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                                        <span
                                            style={{
                                                background: 'rgba(17,24,39,0.92)',
                                                color: '#fff',
                                                borderRadius: 12,
                                                padding: '4px 8px',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                backdropFilter: 'blur(10px)',
                                            }}
                                        >
                                            Đã bán {item.quantitySold}
                                        </span>
                                    </div>

                                    {/* Bottom overlay */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: 8,
                                            right: 8,
                                            bottom: 8,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                background: 'rgba(255,255,255,0.95)',
                                                color: '#111827',
                                                fontWeight: 700,
                                                borderRadius: 12,
                                                padding: '8px 12px',
                                                maxWidth: '70%',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                backdropFilter: 'blur(10px)',
                                            }}
                                        >
                                            {item.itemName}
                                        </span>
                                        <span
                                            style={{
                                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                color: '#fff',
                                                borderRadius: 10,
                                                padding: '8px 12px',
                                                fontWeight: 800,
                                            }}
                                        >
                                            {Number(item.price).toLocaleString('vi-VN')}₫
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default TopItems;
