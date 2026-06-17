'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiGet } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';
import { motion } from 'framer-motion';

interface MenuItem {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
}

interface FeaturedItemsProps {
    count?: number; // count is ignored now, we fetch all items
}

const FeaturedItems: React.FC<FeaturedItemsProps> = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                // Fetch ALL items by using a large limit
                const limit = 100;
                const data = await apiGet<MenuItem[]>(`/api/menu-items?limit=${limit}`);
                setItems(data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(getErrorMessage(err, 'Không thể tải danh sách món.'));
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    if (loading) return null; // Or keep simple loading state
    if (error) return null;
    if (items.length === 0) return null;

    // Duplicate items to ensure smooth infinite scroll even with few items
    // We need enough items to fill the screen width + buffer
    const marqueeItems = [...items, ...items, ...items, ...items];

    return (
        <section className="py-12 overflow-hidden bg-white">
            <div className="container mx-auto px-4 mb-8 text-center">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600 inline-block">
                    Món Nổi Bật
                </h2>
            </div>

            <div className="relative w-full overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />

                <motion.div
                    className="flex gap-6 w-max"
                    animate={{ x: [0, -items.length * 324] }} // 300px width + 24px gap = 324px
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: items.length * 5, // Adjust speed: larger multiplier = slower
                            ease: "linear",
                        },
                    }}
                >
                    {marqueeItems.map((item, index) => (
                        <Link
                            key={`${item.id}-${index}`}
                            href={`/menu/${item.id}`}
                            className="block" // Make Link behave like a block
                        >
                            <div
                                className="relative flex-shrink-0 w-[300px] h-[360px] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow duration-300"
                            >
                                {/* Image Container */}
                                <div className="relative w-full h-[70%] overflow-hidden">
                                    <Image
                                        src={item.imageUrl || '/placeholder.png'}
                                        alt={item.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 300px"
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                                </div>

                                {/* Content Container */}
                                <div className="p-4 h-[30%] flex flex-col justify-between">
                                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2" title={item.name}>
                                        {item.name}
                                    </h3>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-amber-600 font-extrabold text-lg">
                                            {item.price.toLocaleString('vi-VN')}₫
                                        </span>
                                        <button className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-orange-200 transition-colors">
                                            Xem ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FeaturedItems;
