'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getToken } from '@/lib/auth/auth-utils';
import TopItems from '@/components/TopItems';
import FeaturedItems from '@/components/FeaturedItems';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/lib/api/client';

// Animation variants
const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" as const }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const navItem = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

const scaleHover = {
    whileHover: { scale: 1.05, transition: { duration: 0.2 } },
    whileTap: { scale: 0.95 }
};


export default function HomePage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    // Redirect admin and staff to dashboard
    useEffect(() => {
        if (user?.roles && (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_STAFF'))) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    // Navbar scroll effect
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Enhanced carousel with crossfade
    const images = ['/assets/img1.png', '/assets/img2.png', '/assets/img3.png'];
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [images.length]);

    // Contact form
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [isSubmittingContact, setIsSubmittingContact] = useState(false);

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        setIsSubmittingContact(true);
        try {
            const response = await fetch(`${API_URL}/api/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: contactName.trim(),
                    email: contactEmail.trim(),
                    message: contactMessage.trim(),
                }),
            });

            if (response.ok) {
                alert(`Cảm ơn ${contactName}! Chúng tôi đã nhận được liên hệ của bạn.`);
                setContactName('');
                setContactEmail('');
                setContactMessage('');
            } else {
                const rawText = await response.text();
                let errorMessage = 'Không thể gửi liên hệ';
                try {
                    const errorJson = JSON.parse(rawText);
                    errorMessage = errorJson.message || errorJson.error || errorMessage;
                } catch {
                    if (rawText) errorMessage = rawText;
                }
                alert(`Lỗi: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error submitting contact:', error);
            alert('Có lỗi xảy ra khi gửi liên hệ. Vui lòng thử lại!');
        } finally {
            setIsSubmittingContact(false);
        }
    };

    // Food suggestion form (only for logged-in users)
    const [suggestionFood, setSuggestionFood] = useState('');
    const [suggestionDescription, setSuggestionDescription] = useState('');
    const [suggestionCategory, setSuggestionCategory] = useState('');
    const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
    const [suggestionFeedback, setSuggestionFeedback] = useState<{
        type: 'success' | 'error' | null;
        message: string | null;
    }>({ type: null, message: null });

    const handleSuggestionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setSuggestionFeedback({
                type: 'error',
                message: 'Vui lòng đăng nhập để gửi đề xuất'
            });
            return;
        }

        setIsSubmittingSuggestion(true);
        setSuggestionFeedback({ type: null, message: null });

        try {
            const token = getToken(); // Lấy token từ cookie (auth-utils), không dùng localStorage
            const response = await fetch('http://localhost:8080/api/food-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    foodName: suggestionFood,
                    description: suggestionDescription,
                    category: suggestionCategory || null
                })
            });

            if (response.ok) {
                const data = await response.json();
                setSuggestionFeedback({
                    type: 'success',
                    message: `Cảm ơn bạn đã đề xuất món "${data.foodName}"! Hiện tại món này có ${data.votes} lượt yêu cầu.`
                });
                setSuggestionFood('');
                setSuggestionDescription('');
                setSuggestionCategory('');
            } else {
                // Backend có thể trả về plain text (ví dụ "Invalid token") thay vì JSON
                // khi lỗi xác thực, nên cần xử lý an toàn
                const rawText = await response.text();
                let errorMessage = 'Không thể gửi đề xuất';
                try {
                    const errorJson = JSON.parse(rawText);
                    errorMessage = errorJson.message || errorJson.error || errorMessage;
                } catch {
                    // Không phải JSON → dùng raw text nếu có
                    if (rawText) errorMessage = rawText;
                }
                if (response.status === 401 || response.status === 403) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                }
                setSuggestionFeedback({
                    type: 'error',
                    message: errorMessage
                });
            }
        } catch (error) {
            console.error('Error submitting suggestion:', error);
            setSuggestionFeedback({
                type: 'error',
                message: 'Có lỗi xảy ra khi gửi đề xuất. Vui lòng thử lại!'
            });
        } finally {
            setIsSubmittingSuggestion(false);
        }
    };



    // Parallax scroll effect
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);


    return (
        <div className="home container-fluid p-0">
            <motion.section
                className={`roles ${scrolled ? 'scrolled' : ''}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <motion.div className="nav-container" variants={staggerContainer} initial="initial" animate="animate">
                    {/* Logo bên trái */}
                    <motion.div className="brand" {...navItem}>
                        <motion.div
                            className="brand-text-logo flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Image
                                src="/assets/coffee-cup-drink-cafe-svgrepo-com.svg"
                                alt="Coffee"
                                width={32}
                                height={32}
                                className="brand-emoji"
                            />
                            <span className="brand-title-text">The Coffee House</span>
                        </motion.div>
                    </motion.div>

                    {/* Navigation */}
                    <motion.nav className="nav-links" variants={staggerContainer} initial="initial" animate="animate">
                        <motion.div {...navItem}>
                            <Link href="/menu" className="nav-link">
                                Thực Đơn
                            </Link>
                        </motion.div>
                        <motion.div {...navItem}>
                            <Link href="/home#about" className="nav-link">
                                Về Chúng Tôi
                            </Link>
                        </motion.div>
                        <motion.div {...navItem}>
                            <Link href="/home#contact" className="nav-link">
                                Liên Hệ
                            </Link>
                        </motion.div>
                        {user && (
                            <motion.div {...navItem}>
                                <Link href="/profile" className="nav-link with-icon">
                                    Thông Tin Cá Nhân
                                </Link>
                            </motion.div>
                        )}
                        {user && (
                            <motion.div {...navItem}>
                                <Link href="/profile/vouchers" className="nav-link with-icon">
                                    Voucher Cá Nhân
                                </Link>
                            </motion.div>
                        )}
                    </motion.nav>
                    {/* Auth info bên phải */}
                    <motion.div className="nav-actions" {...navItem}>
                        {user ? (
                            <div className="auth-info compact">
                                <span>
                                    Xin chào, <strong>{String(user.displayName || user.sub || 'Quý khách')}!</strong>
                                </span>
                                <motion.button
                                    onClick={handleLogout}
                                    className="btn-primary small"
                                    style={{ marginLeft: '0.75rem' }}
                                    {...scaleHover}
                                >
                                    Đăng xuất
                                </motion.button>
                            </div>
                        ) : (
                            <div className="auth-actions">
                                <motion.div {...scaleHover}>
                                    <Link href="/" className="btn-login">
                                        Đăng Nhập
                                    </Link>
                                </motion.div>
                                <motion.div {...scaleHover}>
                                    <Link href="/register" className="btn-outline">
                                        Đăng Ký
                                    </Link>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>

                    {/* Nút Hamburger cho Mobile */}
                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle Menu"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {isMobileMenuOpen ? (
                                <>
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </>
                            ) : (
                                <>
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </>
                            )}
                        </svg>
                    </button>
                </motion.div>
            </motion.section>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            className="mobile-drawer-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.div
                            className="mobile-drawer-content"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                        >
                            <div className="mobile-drawer-links">
                                <Link href="/menu" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className="mobile-drawer-icon" style={{ maskImage: 'url(/assets/restaurant-plate-svgrepo-com.svg)', WebkitMaskImage: 'url(/assets/restaurant-plate-svgrepo-com.svg)' }} />
                                    Thực Đơn
                                </Link>
                                <Link href="/home#about" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className="mobile-drawer-icon" style={{ maskImage: 'url(/assets/about-us-svgrepo-com.svg)', WebkitMaskImage: 'url(/assets/about-us-svgrepo-com.svg)' }} />
                                    Về Chúng Tôi
                                </Link>
                                <Link href="/home#contact" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className="mobile-drawer-icon" style={{ maskImage: 'url(/assets/contact-information-help-svgrepo-com.svg)', WebkitMaskImage: 'url(/assets/contact-information-help-svgrepo-com.svg)' }} />
                                    Liên Hệ
                                </Link>
                                {user && (
                                    <>
                                        <Link href="/profile" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                            <span className="mobile-drawer-icon" style={{ maskImage: 'url(/assets/user-svgrepo-com.svg)', WebkitMaskImage: 'url(/assets/user-svgrepo-com.svg)' }} />
                                            Cá Nhân
                                        </Link>
                                        <Link href="/profile/vouchers" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                            <span className="mobile-drawer-icon" style={{ maskImage: 'url(/assets/voucher-svgrepo-com.svg)', WebkitMaskImage: 'url(/assets/voucher-svgrepo-com.svg)' }} />
                                            Voucher
                                        </Link>
                                    </>
                                )}
                            </div>

                            <div className="mobile-drawer-actions">
                                {user ? (
                                    <div className="auth-info">
                                        <span>
                                            Xin chào,<br />
                                            <strong>{String(user.displayName || user.sub || 'Quý khách')}</strong>
                                        </span>
                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="btn-primary small"
                                        >
                                            Đăng xuất
                                        </button>
                                    </div>
                                ) : (
                                    <div className="auth-actions">
                                        <Link href="/" className="btn-login" onClick={() => setIsMobileMenuOpen(false)}>
                                            Đăng Nhập
                                        </Link>
                                        <Link href="/register" className="btn-outline" onClick={() => setIsMobileMenuOpen(false)}>
                                            Đăng Ký
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Hero Section with Enhanced Carousel */}
            <motion.header className="hero">
                <motion.div className="hero-carousel" style={{ y }}>
                    {images.map((img, index) => (
                        <motion.div
                            key={index}
                            className={`carousel-img-wrapper ${index === currentIndex ? 'active' : ''}`}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{
                                opacity: index === currentIndex ? 1 : 0,
                                scale: index === currentIndex ? 1 : 1.1
                            }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        >
                            <Image
                                src={img}
                                alt={`Slide ${index + 1}`}
                                fill
                                priority={index === 0}
                                style={{ objectFit: 'cover' }}
                            />
                        </motion.div>
                    ))}
                </motion.div>
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    <motion.h1
                        className="floating"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                    >
                        The Coffee House
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                    >
                        Hương vị đặc biệt cho mỗi khoảnh khắc
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.1 }}
                    >
                        <Link href="/menu" className="hero-cta">
                            Khám Phá Menu
                        </Link>
                    </motion.div>
                </motion.div>
            </motion.header>

            {/* Top 3 Best-Selling Items */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
            >
                <TopItems topN={3} />
            </motion.div>

            {/* Featured Items grid */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <FeaturedItems count={7} />
            </motion.div>

            {/* Food Suggestion Section - Only for logged-in users */}
            {user && (
                <motion.section
                    className="food-suggestion"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    style={{
                        padding: '4rem 2rem',
                        backgroundColor: '#f8f9fa',
                        maxWidth: '800px',
                        margin: '3rem auto',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        style={{ textAlign: 'center', marginBottom: '2rem' }}
                    >
                        <h2 style={{
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, #cd601dff 0%, #d96614ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            🍽️ Đề Xuất Món Ăn
                        </h2>
                        <p style={{ color: '#666', fontSize: '1.1rem' }}>
                            Bạn muốn quán có món gì? Hãy cho chúng tôi biết!
                        </p>
                    </motion.div>

                    <motion.form
                        onSubmit={handleSuggestionSubmit}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <AnimatePresence>
                            {suggestionFeedback.type && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        backgroundColor: suggestionFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                                        color: suggestionFeedback.type === 'success' ? '#047857' : '#b91c1c',
                                        border: `1px solid ${suggestionFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                                        fontSize: '0.95rem',
                                        fontWeight: '500',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{suggestionFeedback.type === 'success' ? '✅' : '❌'}</span>
                                        <span>{suggestionFeedback.message}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSuggestionFeedback({ type: null, message: null })}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'inherit',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            padding: '0 0.5rem',
                                            lineHeight: 1,
                                            opacity: 0.7,
                                            transition: 'opacity 0.2s'
                                        }}
                                    >
                                        &times;
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            className="form-group"
                            style={{ marginBottom: '1.5rem' }}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <label htmlFor="suggestion-food" style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                Tên món ăn *
                            </label>
                            <input
                                id="suggestion-food"
                                type="text"
                                value={suggestionFood}
                                onChange={(e) => setSuggestionFood(e.target.value)}
                                placeholder="VD: Bún riêu cua, Phở bò..."
                                required
                                disabled={isSubmittingSuggestion}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    fontSize: '1rem',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </motion.div>

                        <motion.div
                            className="form-group"
                            style={{ marginBottom: '1.5rem' }}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <label htmlFor="suggestion-category" style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                Phân loại (tùy chọn)
                            </label>
                            <select
                                id="suggestion-category"
                                value={suggestionCategory}
                                onChange={(e) => setSuggestionCategory(e.target.value)}
                                disabled={isSubmittingSuggestion}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    fontSize: '1rem',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="">-- Chọn loại --</option>
                                <option value="MAIN_DISH">Món chính</option>
                                <option value="DESSERT">Tráng miệng</option>
                                <option value="DRINK">Đồ uống</option>
                                <option value="APPETIZER">Khai vị</option>
                            </select>
                        </motion.div>

                        <motion.div
                            className="form-group"
                            style={{ marginBottom: '1.5rem' }}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <label htmlFor="suggestion-description" style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                Mô tả (tùy chọn)
                            </label>
                            <textarea
                                id="suggestion-description"
                                rows={3}
                                value={suggestionDescription}
                                onChange={(e) => setSuggestionDescription(e.target.value)}
                                placeholder="Mô tả thêm về món ăn..."
                                disabled={isSubmittingSuggestion}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    fontSize: '1rem',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                        </motion.div>

                        <motion.button
                            type="submit"
                            disabled={isSubmittingSuggestion}
                            className="btn-submit"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            {...scaleHover}
                            style={{
                                width: '100%',
                                padding: '1rem 2rem',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                background: isSubmittingSuggestion
                                    ? '#ccc'
                                    : 'linear-gradient(135deg, #d15b12ff 0%, #d2660dff 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isSubmittingSuggestion ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {isSubmittingSuggestion ? '⏳ Đang gửi...' : 'Gửi Đề Xuất'}
                        </motion.button>
                    </motion.form>

                    <motion.p
                        style={{
                            marginTop: '1.5rem',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            color: '#666'
                        }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                    >
                        💡 Nếu món đã có người đề xuất, vote của bạn sẽ được cộng dồn!
                    </motion.p>
                </motion.section>
            )}

            {/* About Us */}
            <motion.section
                id="about"
                className="about"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                <div className="about-container">
                    <motion.div
                        className="about-left"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2>Về Chúng Tôi</h2>
                        <p>
                            <b>The Coffee House</b> là không gian dành cho những người yêu cà phê và muốn tận
                            hưởng những khoảnh khắc thư giãn. Chúng tôi chọn lọc hạt cà phê chất lượng, rang xay
                            chuẩn vị và phục vụ với tất cả sự tận tâm.
                        </p>
                        <ul className="about-list">
                            <li>Hạt cà phê chọn lọc</li>
                            <li>Không gian ấm cúng</li>
                            <li>Phục vụ tận tình</li>
                        </ul>
                    </motion.div>
                    <motion.div
                        className="about-right"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        <motion.div className="about-card" {...fadeInUp} {...scaleHover}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Image
                                    src="/assets/cafe-icon.svg"
                                    alt="Coffee"
                                    width={38}
                                    height={38}
                                    className="brand-emoji"
                                />
                                <span>Hương vị đặc trưng</span>
                            </div>
                        </motion.div>
                        <motion.div className="about-card" {...fadeInUp} {...scaleHover} transition={{ ...fadeInUp.transition, delay: 0.2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Image
                                    src="/assets/cake-icon.svg"
                                    alt="Cake"
                                    width={30}
                                    height={30}
                                    className="brand-emoji"
                                />
                                <span>Bánh ngọt thơm ngon</span>
                            </div>
                        </motion.div>
                        <motion.div className="about-card" {...fadeInUp} {...scaleHover} transition={{ ...fadeInUp.transition, delay: 0.4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Image
                                    src="/assets/barista-icon.svg"
                                    alt="Barista"
                                    width={32}
                                    height={32}
                                    className="brand-emoji"
                                />
                                <span>Barista giàu kinh nghiệm</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Contact */}
            <motion.section
                id="contact"
                className="contact"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                <motion.div
                    className="contact-container"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Liên Hệ
                    </motion.h2>
                    <motion.form
                        className="contact-form"
                        onSubmit={handleContactSubmit}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <motion.div
                            className="form-group"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <label htmlFor="c-name">Họ và tên</label>
                            <input
                                id="c-name"
                                type="text"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                placeholder="Nhập họ và tên"
                                required
                                disabled={isSubmittingContact}
                            />
                        </motion.div>
                        <motion.div
                            className="form-group"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <label htmlFor="c-email">Email</label>
                            <input
                                id="c-email"
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={isSubmittingContact}
                            />
                        </motion.div>
                        <motion.div
                            className="form-group"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <label htmlFor="c-message">Nội dung</label>
                            <textarea
                                id="c-message"
                                rows={4}
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                                placeholder="Tin nhắn của bạn..."
                                required
                                disabled={isSubmittingContact}
                            />
                        </motion.div>
                        <motion.button
                            type="submit"
                            className="btn-submit"
                            disabled={isSubmittingContact}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            {...scaleHover}
                        >
                            {isSubmittingContact ? 'Đang gửi...' : 'Gửi liên hệ'}
                        </motion.button>
                    </motion.form>
                </motion.div>
            </motion.section>

            <motion.footer
                className="footer"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <div className="footer-container">
                    <div className="footer-content">
                        {/* Logo và thông tin chính */}
                        <div className="footer-brand">
                            <img
                                src="/assets/logoTheCoffeHouseV3.png"
                                alt="The Coffee House"
                                className="footer-logo"
                                style={{ width: '150px', height: 'auto' }}
                            />
                            <h3>The Coffee House</h3>
                        </div>

                        {/* Thông tin liên hệ */}
                        <div className="footer-section">
                            <h4>Liên hệ</h4>
                            <p>📍 394 Mỹ Đình, Nam Từ Liêm, Hà Nội</p>
                            <p>📞 (028) 1234 5678</p>
                        </div>

                        {/* Giờ hoạt động */}
                        <div className="footer-section">
                            <h4>Giờ mở cửa</h4>
                            <p>T2-T6: 7:00 - 22:00</p>
                            <p>T7-CN: 6:30 - 23:00</p>
                        </div>

                        {/* Mạng xã hội */}
                        <div className="footer-section">
                            <h4>Theo dõi</h4>
                            <div className="social-links">
                                <a href="#" className="social-link">
                                    👥 Facebook
                                </a>
                                <a href="#" className="social-link">
                                    📷 Instagram
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="footer-bottom">
                        <p>&copy; 2026 The Coffee House. All rights reserved.</p>
                    </div>
                </div>
            </motion.footer>
        </div>
    );
}
