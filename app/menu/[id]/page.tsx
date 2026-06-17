'use client';

import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Button, Spin, Breadcrumb, App } from 'antd';
import { ShoppingCartOutlined, HomeOutlined, ArrowLeftOutlined, HeartOutlined, ShareAltOutlined, StarOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';
import Link from 'next/link';
import { motion } from 'framer-motion';
import FeaturedItems from '@/components/FeaturedItems'; // Reuse for Related Products

const { Title, Text, Paragraph } = Typography;

interface MenuItem {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    category?: {
        id: number;
        name: string;
    };
    description?: string;
}

export default function ProductDetailPage() {
    const { message } = App.useApp();
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [item, setItem] = useState<MenuItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (!id) return;
        // Reset quantity when id changes
        setQuantity(1);

        const fetchItem = async () => {
            setLoading(true);
            try {
                const data = await apiGet<MenuItem>(`/api/menu-items/${id}`);
                setItem(data);
            } catch (error) {
                console.error(error);
                message.error(getErrorMessage(error, 'Không thể tải thông tin món ăn'));
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [id]);

    const handleBack = () => {
        router.back();
    };

    const handleAddToCart = () => {
        message.success(`Đã thêm ${quantity} ${item?.name} vào giỏ hàng!`);
        // Actual cart logic would go here
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: '#888', fontWeight: 500 }}>Đang pha chế món ngon...</div>
            </div>
        );
    }

    if (!item) {
        return (
            <div style={{ textAlign: 'center', marginTop: 100 }}>
                <Title level={3}>Không tìm thấy món ăn này!</Title>
                <Button type="primary" onClick={() => router.push('/home')}>Về Thực Đơn</Button>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#fdfbf7', minHeight: '100vh', paddingBottom: 60 }}>
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px', position: 'relative', zIndex: 1 }}>

                {/* Navigation Bar */}
                <div className="flex justify-between items-center mb-8">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBack}
                        className="hover:bg-white/50"
                        style={{ fontSize: 16, fontWeight: 500 }}
                    >
                        Quay lại
                    </Button>
                    <Breadcrumb
                        separator=">"
                        items={[
                            { title: <Link href="/home" className="text-gray-500 hover:text-orange-600"><HomeOutlined /></Link> },
                            { title: <Link href="/menu" className="text-gray-500 hover:text-orange-600">Thực đơn</Link> },
                            { title: <span className="font-semibold text-orange-600">{item.name}</span> },
                        ]}
                    />
                </div>

                <div className="bg-white rounded-[40px] shadow-xl p-6 md:p-12 border border-orange-100 overflow-hidden relative">
                    {/* Floating blobs for style */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>

                    <Row gutter={[64, 32]} align="middle">
                        {/* Product Image Section */}
                        <Col xs={24} lg={12}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="relative group"
                            >
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    paddingTop: '100%',
                                    borderRadius: '50% 50% 40% 40% / 40% 40% 50% 50%', // Organic shape 
                                    overflow: 'hidden',
                                    backgroundColor: '#fff',
                                    boxShadow: '0 25px 50px -12px rgba(255, 120, 0, 0.25)',
                                    marginBottom: 20
                                }}>
                                    <Image
                                        src={item.imageUrl || '/placeholder.png'}
                                        alt={item.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        priority
                                        className="transform transition-transform duration-700 group-hover:scale-110"
                                    />

                                    {/* Action buttons on image */}
                                    <div className="absolute top-6 right-6 flex flex-col gap-3">
                                        <Button
                                            shape="circle"
                                            size="large"
                                            icon={isFavorite ? <HeartOutlined style={{ color: '#ef4444' }} /> : <HeartOutlined />}
                                            onClick={() => setIsFavorite(!isFavorite)}
                                            className="bg-white/90 backdrop-blur shadow-md border-0"
                                        />
                                        <Button
                                            shape="circle"
                                            size="large"
                                            icon={<ShareAltOutlined />}
                                            className="bg-white/90 backdrop-blur shadow-md border-0"
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.href);
                                                message.success('Đã sao chép liên kết!');
                                            }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </Col>

                        {/* Product Content Section */}
                        <Col xs={24} lg={12}>
                            <div className="relative z-10">
                                <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 font-bold text-xs uppercase tracking-wider mb-4">
                                    {item.category?.name || 'Signature'}
                                </div>

                                <Title level={1} style={{ margin: '0 0 16px', fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, color: '#1f2937' }}>
                                    {item.name}
                                </Title>

                                {/* Rating & Stats Mockup */}
                                <div className="flex items-center gap-6 mb-8 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <StarOutlined style={{ color: '#f59e0b' }} />
                                        <span className="font-bold text-gray-900">4.8</span>
                                        <span>(128 đánh giá)</span>
                                    </div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <div>🔥 250 Kcal</div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <div>⏱️ 15-20 phút</div>
                                </div>

                                <div className="text-4xl font-extrabold text-orange-600 mb-8 flex items-baseline gap-2">
                                    {item.price.toLocaleString('vi-VN')}₫
                                    {/* <span className="text-lg text-gray-400 font-normal line-through decoration-gray-300">{(item.price * 1.2).toLocaleString()}₫</span> */}
                                </div>

                                <Paragraph style={{ fontSize: 17, color: '#4b5563', lineHeight: 1.8, marginBottom: 40 }}>
                                    {item.description || 'Hương vị tuyệt hảo, được chế biến từ những nguyên liệu tươi ngon nhất. Thưởng thức ngay để cảm nhận sự khác biệt!'}
                                </Paragraph>

                                {/* Quantity & Add Cart */}
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex items-center bg-gray-100 rounded-full p-1.5">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold text-lg disabled:opacity-50"
                                            disabled={quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span className="w-12 text-center font-bold text-lg text-gray-800">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold text-lg"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<ShoppingCartOutlined />}
                                        onClick={handleAddToCart}
                                        style={{
                                            height: 54,
                                            padding: '0 40px',
                                            borderRadius: 27,
                                            fontSize: 16,
                                            fontWeight: 700,
                                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                                            border: 'none',
                                            boxShadow: '0 10px 25px -5px rgba(234, 88, 12, 0.4)'
                                        }}
                                        className="hover:!scale-105 transition-transform duration-300 flex-grow md:flex-grow-0"
                                    >
                                        Thêm vào giỏ
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Related Products Section */}
                <div className="mt-20">
                    <Title level={2} style={{ textAlign: 'center', marginBottom: 40, fontSize: '2rem' }}>
                        Có thể bạn sẽ thích
                    </Title>
                    {/* Reusing FeaturedItems marquee as "Related Products" for now */}
                    <FeaturedItems count={10} />
                </div>

            </div>
        </div>
    );
}
