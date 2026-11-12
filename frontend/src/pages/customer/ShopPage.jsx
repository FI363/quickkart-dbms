/**
 * QuickKart: Quick-Commerce Management System
 * Flagship Customer Shopping Interface — Apple Bento Design × Blinkit/Zepto Speed
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
    Plus,
    Minus,
    Zap,
    Sparkles,
    Store,
    SlidersHorizontal,
    CheckCircle2,
    AlertTriangle,
    X,
    ShieldCheck,
    Layers,
    Tag,
    ArrowUpDown,
    Flame
} from 'lucide-react';

// Curated visual icons & backdrops for categories (Blinkit/Zepto style)
function getCategoryVisual(name = '') {
    const lower = name.toLowerCase();
    if (lower.includes('milk')) return { emoji: '🥛', bg: '#eff6ff' };
    if (lower.includes('curd') || lower.includes('paneer')) return { emoji: '🧀', bg: '#fefce8' };
    if (lower.includes('bread') || lower.includes('egg')) return { emoji: '🍞', bg: '#fff7ed' };
    if (lower.includes('dairy') || lower.includes('breakfast')) return { emoji: '🥐', bg: '#fef3c7' };
    if (lower.includes('veg')) return { emoji: '🥦', bg: '#f0fdf4' };
    if (lower.includes('fruit')) return { emoji: '🍎', bg: '#fef2f2' };
    if (lower.includes('chip') || lower.includes('crisp')) return { emoji: '🥔', bg: '#fffbeb' };
    if (lower.includes('biscuit') || lower.includes('cookie')) return { emoji: '🍪', bg: '#fdf4ff' };
    if (lower.includes('snack') || lower.includes('munch')) return { emoji: '🍿', bg: '#fff1f2' };
    if (lower.includes('cold') || lower.includes('soda') || lower.includes('drink')) return { emoji: '🥤', bg: '#ecfeff' };
    if (lower.includes('tea') || lower.includes('coffee')) return { emoji: '☕', bg: '#f5f3ff' };
    if (lower.includes('beverage')) return { emoji: '🧃', bg: '#f0f9ff' };
    if (lower.includes('oil') || lower.includes('masala') || lower.includes('atta') || lower.includes('rice')) return { emoji: '🌾', bg: '#fef9c3' };
    if (lower.includes('clean') || lower.includes('home') || lower.includes('detergent')) return { emoji: '🫧', bg: '#e0f2fe' };
    return { emoji: '🛍️', bg: '#f1f5f9' };
}

export default function ShopPage({ searchQuery }) {
    const { selectedStore, addToCart, cart, removeFromCart } = useApp();
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedVariants, setSelectedVariants] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Pro Shop Controls
    const [inStockOnly, setInStockOnly] = useState(false);
    const [discountsOnly, setDiscountsOnly] = useState(false);
    const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price-asc' | 'price-desc' | 'stock-desc'
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    // Load categories on mount
    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await api.getCategories();
                if (res.data) {
                    // Flatten parent + subcategories so user can browse cleanly
                    const flat = [];
                    res.data.forEach(cat => {
                        flat.push(cat);
                        if (cat.subcategories && cat.subcategories.length > 0) {
                            cat.subcategories.forEach(sub => flat.push(sub));
                        }
                    });
                    setCategories(flat);
                }
            } catch (err) {
                console.error(err);
            }
        }
        fetchCategories();
    }, []);

    // Fetch products whenever store, category, or search query changes
    useEffect(() => {
        async function fetchProducts() {
            setIsLoading(true);
            try {
                const params = {};
                if (selectedStore) params.storeId = selectedStore.store_id;
                if (selectedCategory) params.categoryId = selectedCategory.category_id;
                if (searchQuery) params.search = searchQuery;

                const res = await api.getProducts(params);
                if (res.data) {
                    setProducts(res.data);

                    // Initialize default selected variant for each product (prefer first in-stock variant)
                    const initialVariants = {};
                    res.data.forEach(p => {
                        if (p.variants && p.variants.length > 0) {
                            const firstInStock = p.variants.find(v => (v.available_quantity ?? 0) > 0);
                            initialVariants[p.product_id] = firstInStock || p.variants[0];
                        } else if (p.variant_id) {
                            initialVariants[p.product_id] = p;
                        }
                    });
                    setSelectedVariants(initialVariants);
                }
            } catch (err) {
                console.error('Failed to load products:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProducts();
    }, [selectedStore, selectedCategory, searchQuery]);

    // Helper: find current quantity in cart for a variant
    const getCartQuantity = (variantId) => {
        if (!cart.items) return 0;
        const item = cart.items.find(i => i.variant_id === variantId);
        return item ? item.quantity : 0;
    };

    // Filtered & Sorted Products
    const displayedProducts = useMemo(() => {
        return products
            .filter(product => {
                const currentVariant = selectedVariants[product.product_id] || (product.variants && product.variants[0]) || (product.variant_id ? product : null);
                const available = currentVariant
                    ? (currentVariant.available_quantity !== undefined ? currentVariant.available_quantity : (currentVariant.total_quantity !== undefined ? currentVariant.total_quantity : 20))
                    : (product.available_quantity !== undefined ? product.available_quantity : 0);

                if (inStockOnly && available <= 0) return false;

                if (discountsOnly) {
                    const price = Number(currentVariant?.price ?? product.min_price ?? 0);
                    const mrp = Number(currentVariant?.mrp ?? price);
                    if (mrp <= price) return false;
                }

                return true;
            })
            .sort((a, b) => {
                const varA = selectedVariants[a.product_id] || (a.variants && a.variants[0]) || a;
                const varB = selectedVariants[b.product_id] || (b.variants && b.variants[0]) || b;
                const priceA = Number(varA?.price ?? a.min_price ?? 0);
                const priceB = Number(varB?.price ?? b.min_price ?? 0);
                const stockA = Number(varA?.available_quantity ?? a.available_quantity ?? 0);
                const stockB = Number(varB?.available_quantity ?? b.available_quantity ?? 0);

                if (sortBy === 'price-asc') return priceA - priceB;
                if (sortBy === 'price-desc') return priceB - priceA;
                if (sortBy === 'stock-desc') return stockB - stockA;
                // Default: In-stock items first
                if ((stockA > 0) !== (stockB > 0)) return stockA > 0 ? -1 : 1;
                return 0;
            });
    }, [products, selectedVariants, inStockOnly, discountsOnly, sortBy]);

    // Live Store Telemetry Stats
    const inStockProductsCount = useMemo(() => {
        return products.filter(p => {
            const v = selectedVariants[p.product_id] || (p.variants && p.variants[0]) || p;
            return (v?.available_quantity ?? p.available_quantity ?? 0) > 0;
        }).length;
    }, [products, selectedVariants]);

    return (
        <div>
            {/* 1. Apple Bento-Grid Hero Showcase */}
            {!searchQuery && (
                <div className="qk-bento-grid">
                    {/* Left Primary Hero Card */}
                    <div className="qk-bento-main">
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 7,
                                background: 'rgba(16, 185, 129, 0.18)',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                color: '#34d399',
                                padding: '5px 13px',
                                borderRadius: 999,
                                fontSize: '0.73rem',
                                fontWeight: 800,
                                letterSpacing: '0.06em',
                                marginBottom: 16
                            }}>
                                <Zap size={13} fill="#34d399" />
                                <span>8-MINUTE SUPERFAST DARK STORE DELIVERY</span>
                            </div>

                            <h2 style={{
                                fontSize: '2.2rem',
                                fontWeight: 800,
                                letterSpacing: '-0.035em',
                                lineHeight: 1.12,
                                maxWidth: 520,
                                marginBottom: 12
                            }}>
                                Fresh groceries at your door before the kettle boils.
                            </h2>

                            <p style={{
                                color: '#94a3b8',
                                fontSize: '0.94rem',
                                lineHeight: 1.55,
                                maxWidth: 490,
                                marginBottom: 22
                            }}>
                                Dispatched live from <strong style={{ color: '#f8fafc' }}>{selectedStore ? selectedStore.store_name : 'QuickKart T. Nagar Hub'}</strong>.
                                Every unit is tracked in real time with 3NF relational precision and ACID stock reservations.
                            </p>
                        </div>

                        {/* Bottom Telemetry Strip inside Hero */}
                        <div style={{
                            position: 'relative',
                            zIndex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 14,
                            paddingTop: 18,
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <div>
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Active Hub
                                    </div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                                        {selectedStore ? selectedStore.area : 'T. Nagar'}, Chennai
                                    </div>
                                </div>
                                <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.12)' }} />
                                <div>
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Live Availability
                                    </div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399' }}>
                                        {inStockProductsCount} / {products.length} Products Ready
                                    </div>
                                </div>
                                <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.12)' }} />
                                <div>
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Delivery SLA
                                    </div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24' }}>
                                        8 – 12 Mins ⚡
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                padding: '6px 12px',
                                borderRadius: 10,
                                fontSize: '0.74rem',
                                color: '#e2e8f0',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <ShieldCheck size={15} color="#34d399" />
                                <span>InnoDB Row-Lock Protected</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side Bento Stack */}
                    <div className="qk-bento-side">
                        {/* Top Side Card: Farm Fresh Dairy & Morning Essentials */}
                        <div
                            className="qk-bento-card"
                            style={{
                                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                const dairy = categories.find(c => c.category_name.toLowerCase().includes('milk') || c.category_name.toLowerCase().includes('dairy'));
                                setSelectedCategory(dairy || null);
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <span style={{
                                        display: 'inline-block',
                                        fontSize: '0.66rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        background: 'rgba(217, 119, 6, 0.14)',
                                        color: '#b45309',
                                        padding: '3px 9px',
                                        borderRadius: 999,
                                        marginBottom: 8
                                    }}>
                                        MORNING ESSENTIALS
                                    </span>
                                    <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                                        Farm-Fresh Milk, Paneer & Artisanal Bread
                                    </h3>
                                </div>
                                <span style={{ fontSize: '2.2rem' }}>🥛</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: 14,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#92400e'
                            }}>
                                <span>Cold-chain stored at 4°C • Amul & Aavin</span>
                                <span>Explore →</span>
                            </div>
                        </div>

                        {/* Bottom Side Card: Zero Fee & Instant Offers */}
                        <div
                            className="qk-bento-card"
                            style={{
                                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                cursor: 'pointer'
                            }}
                            onClick={() => setDiscountsOnly(prev => !prev)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <span style={{
                                        display: 'inline-block',
                                        fontSize: '0.66rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        background: 'rgba(5, 150, 105, 0.15)',
                                        color: '#047857',
                                        padding: '3px 9px',
                                        borderRadius: 999,
                                        marginBottom: 8
                                    }}>
                                        SUPER SAVER DEALS
                                    </span>
                                    <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                                        Zero Delivery Fee on Orders Above ₹199
                                    </h3>
                                </div>
                                <span style={{ fontSize: '2.2rem' }}>⚡</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: 14,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#065f46'
                            }}>
                                <span>Direct below-MRP dark store pricing</span>
                                <span>{discountsOnly ? 'Showing Deals ✓' : 'Filter Deals →'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Blinkit / Zepto Visual Category Dock */}
            <div style={{ marginBottom: 8 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12
                }}>
                    <h3 style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        color: '#0f172a'
                    }}>
                        Shop by Category
                    </h3>
                    {selectedCategory && (
                        <button
                            onClick={() => setSelectedCategory(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#0ca678',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Reset Category ✕
                        </button>
                    )}
                </div>

                <div className="qk-category-rail">
                    <div
                        className={`qk-cat-tile ${selectedCategory === null ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        <div className="qk-cat-icon-box" style={{ background: '#ecfdf5' }}>
                            ⚡
                        </div>
                        <span style={{
                            fontSize: '0.76rem',
                            fontWeight: selectedCategory === null ? 800 : 600,
                            color: selectedCategory === null ? '#0ca678' : '#334155',
                            textAlign: 'center',
                            whiteSpace: 'nowrap'
                        }}>
                            All Store
                        </span>
                    </div>

                    {categories.map(cat => {
                        const isSelected = selectedCategory && selectedCategory.category_id === cat.category_id;
                        const visual = getCategoryVisual(cat.category_name);
                        return (
                            <div
                                key={cat.category_id}
                                className={`qk-cat-tile ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(isSelected ? null : cat)}
                            >
                                <div className="qk-cat-icon-box" style={{ background: visual.bg }}>
                                    {visual.emoji}
                                </div>
                                <span style={{
                                    fontSize: '0.76rem',
                                    fontWeight: isSelected ? 800 : 600,
                                    color: isSelected ? '#0ca678' : '#334155',
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {cat.category_name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. Smart Filter & Sort Control Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                padding: '12px 18px',
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid rgba(15, 23, 42, 0.06)',
                marginBottom: 22,
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        {selectedCategory ? selectedCategory.category_name : (searchQuery ? `Search: "${searchQuery}"` : 'Fresh Shelf Catalogue')}
                    </span>
                    <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '3px 10px',
                        borderRadius: 999
                    }}>
                        {displayedProducts.length} {displayedProducts.length === 1 ? 'Product' : 'Products'}
                    </span>
                </div>

                {/* Quick Filter & Sort Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setInStockOnly(prev => !prev)}
                        style={{
                            padding: '6px 13px',
                            borderRadius: 999,
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            border: '1px solid',
                            borderColor: inStockOnly ? '#0ca678' : 'rgba(15, 23, 42, 0.1)',
                            background: inStockOnly ? '#e6fcf5' : '#ffffff',
                            color: inStockOnly ? '#087f5b' : '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'all 150ms ease'
                        }}
                    >
                        <CheckCircle2 size={13} />
                        <span>In Stock Only</span>
                    </button>

                    <button
                        onClick={() => setDiscountsOnly(prev => !prev)}
                        style={{
                            padding: '6px 13px',
                            borderRadius: 999,
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            border: '1px solid',
                            borderColor: discountsOnly ? '#2563eb' : 'rgba(15, 23, 42, 0.1)',
                            background: discountsOnly ? '#eff6ff' : '#ffffff',
                            color: discountsOnly ? '#1d4ed8' : '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'all 150ms ease'
                        }}
                    >
                        <Flame size={13} />
                        <span>Special Offers</span>
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 12px',
                        borderRadius: 999,
                        border: '1px solid rgba(15, 23, 42, 0.1)',
                        background: '#f8fafc',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        color: '#475569'
                    }}>
                        <ArrowUpDown size={13} />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                color: '#0f172a',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="featured">Sort: Featured</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="stock-desc">Stock: High to Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 4. Flagship Product Grid */}
            {isLoading ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(228px, 1fr))',
                    gap: 20
                }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <div
                            key={n}
                            style={{
                                height: 320,
                                borderRadius: 22,
                                background: '#ffffff',
                                padding: 16,
                                border: '1px solid rgba(15,23,42,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12
                            }}
                        >
                            <div style={{ height: 160, borderRadius: 16, background: '#f1f5f9' }} />
                            <div style={{ height: 14, width: '40%', borderRadius: 6, background: '#f1f5f9' }} />
                            <div style={{ height: 18, width: '85%', borderRadius: 6, background: '#f1f5f9' }} />
                            <div style={{ marginTop: 'auto', height: 36, borderRadius: 10, background: '#f1f5f9' }} />
                        </div>
                    ))}
                </div>
            ) : displayedProducts.length === 0 ? (
                <div style={{
                    background: '#ffffff',
                    borderRadius: 24,
                    padding: '64px 24px',
                    textAlign: 'center',
                    border: '1px solid rgba(15, 23, 42, 0.06)'
                }}>
                    <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>🔍</div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                        No groceries match your filter
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 18 }}>
                        Try clearing your search filter or switching to another dark store hub.
                    </p>
                    <button
                        onClick={() => {
                            setSelectedCategory(null);
                            setInStockOnly(false);
                            setDiscountsOnly(false);
                        }}
                        className="qk-add-btn"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                <div className="qk-product-grid">
                    {displayedProducts.map(product => {
                        const currentVariant = selectedVariants[product.product_id] || (product.variants && product.variants[0]) || (product.variant_id ? product : null);
                        const cartQty = currentVariant ? getCartQuantity(currentVariant.variant_id) : 0;
                        const available = currentVariant
                            ? (currentVariant.available_quantity !== undefined ? currentVariant.available_quantity : (currentVariant.total_quantity !== undefined ? currentVariant.total_quantity : 20))
                            : (product.available_quantity !== undefined ? product.available_quantity : 0);
                        const isLowStock = available > 0 && available <= 10;
                        const isOutOfStock = available <= 0;

                        const price = Number(currentVariant?.price ?? product?.price ?? product?.min_price ?? 0);
                        const mrp = Number(currentVariant?.mrp ?? price);
                        const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

                        return (
                            <div
                                key={product.product_id}
                                className={`qk-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                            >
                                {/* Product Image Container */}
                                <div
                                    className="qk-product-img-wrap"
                                    onClick={() => setQuickViewProduct(product)}
                                    title="Click for Product & 3NF Stock Details"
                                >
                                    {/* Discount Tag (Top Left) */}
                                    {discountPct > 0 && (
                                        <div className="qk-discount-tag">
                                            {discountPct}% OFF
                                        </div>
                                    )}

                                    {/* Live Stock Micro-Badge (Top Right) */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        zIndex: 3,
                                        background: isOutOfStock
                                            ? 'rgba(254, 226, 226, 0.95)'
                                            : isLowStock
                                            ? 'rgba(254, 243, 199, 0.95)'
                                            : 'rgba(236, 253, 245, 0.92)',
                                        color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#059669',
                                        padding: '3px 8px',
                                        borderRadius: 8,
                                        fontSize: '0.66rem',
                                        fontWeight: 800,
                                        backdropFilter: 'blur(6px)',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                                    }}>
                                        {isOutOfStock ? 'Sold Out' : isLowStock ? `Only ${available} left` : `${available} in stock`}
                                    </div>

                                    {/* 8-Min Delivery SLA Tag (Bottom Left) */}
                                    <div className="qk-sla-badge">
                                        <Zap size={11} fill="#10b981" color="#059669" />
                                        <span>8 MINS</span>
                                    </div>

                                    <img
                                        src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                                        alt={product.product_name}
                                        className="qk-product-img"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Brand Micro-Label */}
                                <div style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    marginBottom: 3
                                }}>
                                    {product.brand_name || 'QuickKart Fresh'}
                                </div>

                                {/* Product Title */}
                                <h3
                                    onClick={() => setQuickViewProduct(product)}
                                    style={{
                                        fontSize: '0.94rem',
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        lineHeight: 1.32,
                                        marginBottom: 10,
                                        minHeight: 40,
                                        cursor: 'pointer',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {product.product_name}
                                </h3>

                                {/* Variant Selector Pills (Apple Segmented Style) */}
                                {product.variants && product.variants.length > 1 ? (
                                    <div className="qk-variant-Readout">
                                        {product.variants.map(v => {
                                            const isVariantActive = currentVariant && currentVariant.variant_id === v.variant_id;
                                            const varAvail = v.available_quantity ?? 0;
                                            return (
                                                <button
                                                    key={v.variant_id}
                                                    type="button"
                                                    onClick={() => setSelectedVariants(prev => ({ ...prev, [product.product_id]: v }))}
                                                    className={`qk-variant-pill ${isVariantActive ? 'active' : ''}`}
                                                    style={{ opacity: varAvail <= 0 ? 0.55 : 1 }}
                                                >
                                                    {v.unit}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{
                                        fontSize: '0.76rem',
                                        fontWeight: 600,
                                        color: '#64748b',
                                        background: '#f8fafc',
                                        padding: '4px 10px',
                                        borderRadius: 8,
                                        alignSelf: 'flex-start',
                                        marginBottom: 10
                                    }}>
                                        {currentVariant?.unit || product?.unit || 'Standard Pack'}
                                    </div>
                                )}

                                {/* Price & Blinkit/Zepto ADD Stepper Footer */}
                                <div style={{
                                    marginTop: 'auto',
                                    paddingTop: 10,
                                    borderTop: '1px solid rgba(15, 23, 42, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: '1.08rem',
                                            fontWeight: 800,
                                            color: '#0f172a',
                                            letterSpacing: '-0.02em',
                                            lineHeight: 1.1
                                        }}>
                                            ₹{price}
                                        </div>
                                        {mrp > price && (
                                            <div style={{
                                                fontSize: '0.73rem',
                                                color: '#94a3b8',
                                                textDecoration: 'line-through',
                                                fontWeight: 600
                                            }}>
                                                MRP ₹{mrp}
                                            </div>
                                        )}
                                    </div>

                                    {/* Cart Action Control */}
                                    {isOutOfStock ? (
                                        <button
                                            disabled
                                            style={{
                                                padding: '7px 14px',
                                                borderRadius: 10,
                                                border: '1px solid #e2e8f0',
                                                background: '#f8fafc',
                                                color: '#94a3b8',
                                                fontSize: '0.76rem',
                                                fontWeight: 700,
                                                cursor: 'not-allowed'
                                            }}
                                        >
                                            Out of Stock
                                        </button>
                                    ) : cartQty === 0 ? (
                                        <button
                                            onClick={() => addToCart(currentVariant || product, product, 1)}
                                            className="qk-add-btn"
                                        >
                                            <span>ADD</span>
                                            <Plus size={14} strokeWidth={2.8} />
                                        </button>
                                    ) : (
                                        <div className="qk-stepper">
                                            <button
                                                onClick={() => cartQty === 1 ? removeFromCart(currentVariant.variant_id) : addToCart(currentVariant, product, cartQty - 1)}
                                                className="qk-stepper-btn"
                                                title="Decrease quantity"
                                            >
                                                <Minus size={14} strokeWidth={2.8} />
                                            </button>
                                            <span>{cartQty}</span>
                                            <button
                                                onClick={() => addToCart(currentVariant, product, cartQty + 1)}
                                                className="qk-stepper-btn"
                                                title="Increase quantity"
                                            >
                                                <Plus size={14} strokeWidth={2.8} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 5. Apple-Style Product Quick-View & 3NF Stock Inspector Modal */}
            {quickViewProduct && (
                <div className="modal-overlay" onClick={() => setQuickViewProduct(null)}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: 580,
                            padding: 0,
                            overflow: 'hidden',
                            borderRadius: 26,
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}
                    >
                        <div style={{
                            position: 'relative',
                            height: 240,
                            background: 'radial-gradient(circle, #ffffff 0%, #f1f5f9 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img
                                src={quickViewProduct.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80'}
                                alt={quickViewProduct.product_name}
                                style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                            />
                            <button
                                onClick={() => setQuickViewProduct(null)}
                                style={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: 'rgba(15, 23, 42, 0.65)',
                                    backdropFilter: 'blur(8px)',
                                    color: 'white',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '24px 28px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: '#0ca678',
                                    background: '#e6fcf5',
                                    padding: '3px 10px',
                                    borderRadius: 999
                                }}>
                                    {quickViewProduct.brand_name}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                                    • {quickViewProduct.category_name}
                                </span>
                            </div>

                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
                                {quickViewProduct.product_name}
                            </h2>

                            <div style={{
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                color: '#475569',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 10
                            }}>
                                Select Pack Size & Live Dark Store Stock ({selectedStore ? selectedStore.store_name : 'Hub'})
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                                {(quickViewProduct.variants || [quickViewProduct]).map(v => {
                                    const avail = v.available_quantity ?? 0;
                                    const qCart = getCartQuantity(v.variant_id);
                                    return (
                                        <div
                                            key={v.variant_id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 16px',
                                                borderRadius: 14,
                                                border: '1.5px solid',
                                                borderColor: qCart > 0 ? '#0ca678' : '#e2e8f0',
                                                background: qCart > 0 ? '#f0fdf4' : '#ffffff'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                                                    {v.unit} <span style={{ fontWeight: 500, color: '#64748b', fontSize: '0.8rem' }}>({v.variant_name})</span>
                                                </div>
                                                <div style={{ fontSize: '0.73rem', color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
                                                    SKU: {v.sku} • Total: {v.total_quantity ?? avail} | Reserved: {v.reserved_quantity ?? 0} | Avail: <strong>{avail}</strong>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>₹{v.price}</div>
                                                    {v.mrp > v.price && (
                                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{v.mrp}</div>
                                                    )}
                                                </div>

                                                {avail <= 0 ? (
                                                    <span className="badge badge-danger">Empty</span>
                                                ) : qCart === 0 ? (
                                                    <button
                                                        onClick={() => addToCart(v, quickViewProduct, 1)}
                                                        className="qk-add-btn"
                                                    >
                                                        ADD +
                                                    </button>
                                                ) : (
                                                    <div className="qk-stepper">
                                                        <button
                                                            onClick={() => qCart === 1 ? removeFromCart(v.variant_id) : addToCart(v, quickViewProduct, qCart - 1)}
                                                            className="qk-stepper-btn"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span>{qCart}</span>
                                                        <button
                                                            onClick={() => addToCart(v, quickViewProduct, qCart + 1)}
                                                            className="qk-stepper-btn"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{
                                padding: '12px 14px',
                                borderRadius: 12,
                                background: '#f8fafc',
                                fontSize: '0.76rem',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <span>⚡ 8-Minute Express Dispatch from {selectedStore ? selectedStore.area : 'T. Nagar'}</span>
                                <span style={{ fontWeight: 700, color: '#0ca678' }}>3NF Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
