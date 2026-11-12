/**
 * QuickKart: Quick-Commerce Management System
 * Flagship Customer Layout — Apple HIG × Blinkit/Zepto Experience
 */

import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    ShoppingBag,
    Search,
    ShoppingCart,
    Zap,
    MapPin,
    Package,
    X,
    ChevronDown,
    ArrowRight,
    ShieldCheck,
    Sparkles,
    Clock
} from 'lucide-react';
import '../styles/customer.css';

export default function CustomerLayout({ children, onSearch, searchQuery }) {
    const {
        cart,
        setIsCartOpen,
        stores,
        selectedStore,
        setSelectedStore,
        addresses,
        selectedAddressId,
        setTrackingOrder
    } = useApp();

    const searchInputRef = useRef(null);

    const cartItemCount = cart.items ? cart.items.reduce((s, i) => s + i.quantity, 0) : 0;
    const activeAddress = addresses?.find(a => a.address_id === selectedAddressId) || addresses?.[0];
    const freeDeliveryThreshold = 199;
    const amountForFreeDelivery = Math.max(0, freeDeliveryThreshold - (cart.subtotal || 0));

    // Keyboard shortcut (⌘K or /) to focus search bar
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="customer-shell">
            {/* Sticky Apple-Glass Header */}
            <header className="qk-header">
                <div className="qk-header-inner">
                    {/* Left: Brand & Blinkit/Zepto 8-Min Location Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <div
                            className="qk-brand"
                            onClick={() => onSearch && onSearch('')}
                            title="Reset filters"
                        >
                            <div className="qk-brand-icon">
                                <ShoppingBag size={22} strokeWidth={2.4} />
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '1.35rem',
                                    fontWeight: 800,
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1,
                                    color: '#0f172a'
                                }}>
                                    Quick<span style={{ color: '#0ca678' }}>Kart</span>
                                </div>
                                <div style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    color: '#64748b',
                                    marginTop: 3,
                                    textTransform: 'uppercase'
                                }}>
                                    Instant Grocery
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: 1, height: 28, background: 'rgba(15, 23, 42, 0.08)' }} />

                        {/* 8-Min Delivery SLA & Hub Selector Pill */}
                        <div className="qk-eta-pill">
                            <div className="qk-bolt-badge">
                                <Zap size={17} fill="#f59e0b" color="#d97706" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{
                                        fontSize: '0.84rem',
                                        fontWeight: 800,
                                        color: '#0f172a',
                                        letterSpacing: '-0.01em'
                                    }}>
                                        Delivery in 8 mins
                                    </span>
                                    <span className="qk-live-dot" title="Dark store live & operational" />
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: '0.73rem',
                                    color: '#475569',
                                    fontWeight: 600
                                }}>
                                    <MapPin size={11} color="#0ca678" />
                                    <select
                                        value={selectedStore ? selectedStore.store_id : ''}
                                        onChange={(e) => {
                                            const found = stores.find(s => s.store_id === parseInt(e.target.value, 10));
                                            if (found) setSelectedStore(found);
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#334155',
                                            fontWeight: 700,
                                            fontSize: '0.73rem',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            paddingRight: 2
                                        }}
                                        title="Switch Dark Store Fulfillment Hub"
                                    >
                                        {stores.map(s => (
                                            <option key={s.store_id} value={s.store_id}>
                                                {s.area} Hub ({s.service_radius_km || '4.5'} km)
                                            </option>
                                        ))}
                                    </select>
                                    {activeAddress && (
                                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                                            • {activeAddress.address_line.slice(0, 18)}...
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center: Spotlight Search Bar */}
                    <div className="qk-search-wrapper">
                        <Search
                            size={17}
                            color="#64748b"
                            style={{
                                position: 'absolute',
                                left: 15,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none'
                            }}
                        />
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="qk-search-input"
                            placeholder='Search "Amul milk", "fresh paneer", "eggs", "chips"...'
                            value={searchQuery}
                            onChange={(e) => onSearch && onSearch(e.target.value)}
                        />
                        {searchQuery ? (
                            <button
                                onClick={() => onSearch && onSearch('')}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: '#e2e8f0',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 22,
                                    height: 22,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#475569'
                                }}
                                title="Clear search"
                            >
                                <X size={13} />
                            </button>
                        ) : (
                            <span style={{
                                position: 'absolute',
                                right: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: '#94a3b8',
                                background: '#ffffff',
                                border: '1px solid rgba(15, 23, 42, 0.08)',
                                padding: '2px 7px',
                                borderRadius: 6,
                                pointerEvents: 'none'
                            }}>
                                ⌘K
                            </span>
                        )}
                    </div>

                    {/* Right: Live Order Tracking & Cart Trigger */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={() => setTrackingOrder({
                                order_id: 1,
                                order_number: 'ORD-20260202-841920',
                                order_status: 'OUT_FOR_DELIVERY',
                                total_amount: 114.00,
                                delivery_partner_name: 'Murugan Selvam',
                                partner_vehicle: 'EV_SCOOTER'
                            })}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '9px 14px',
                                borderRadius: 13,
                                background: '#ffffff',
                                border: '1px solid rgba(15, 23, 42, 0.08)',
                                color: '#0f172a',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
                                transition: 'all 180ms ease'
                            }}
                        >
                            <Package size={16} color="#7950f2" />
                            <span>Track Order</span>
                        </button>

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="qk-cart-trigger"
                        >
                            <ShoppingCart size={18} strokeWidth={2.3} />
                            {cartItemCount > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.9 }}>
                                        {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                                    </span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                                        ₹{Number(cart.subtotal || 0).toFixed(0)}
                                    </span>
                                </div>
                            ) : (
                                <span>My Basket</span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main style={{
                flex: 1,
                maxWidth: 1380,
                width: '100%',
                margin: '0 auto',
                padding: '24px 28px 90px'
            }}>
                {children}
            </main>

            {/* Floating Bottom Cart Island (Apple Dynamic Island × Blinkit View Cart Bar) */}
            {cartItemCount > 0 && (
                <div className="qk-floating-cart-wrap">
                    <div
                        className="qk-floating-cart"
                        onClick={() => setIsCartOpen(true)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            {/* Mini Stacked Product Thumbnails */}
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {cart.items.slice(0, 3).map((item, idx) => (
                                    <img
                                        key={item.variant_id || idx}
                                        src={item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                                        alt={item.product_name}
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            objectFit: 'cover',
                                            border: '2px solid #0f172a',
                                            marginLeft: idx === 0 ? 0 : -12,
                                            background: '#fff'
                                        }}
                                    />
                                ))}
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                                        {cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'} • ₹{Number(cart.subtotal || 0).toFixed(0)}
                                    </span>
                                    {amountForFreeDelivery === 0 ? (
                                        <span style={{
                                            fontSize: '0.68rem',
                                            fontWeight: 700,
                                            background: 'rgba(16, 185, 129, 0.2)',
                                            color: '#34d399',
                                            padding: '2px 8px',
                                            borderRadius: 999
                                        }}>
                                            FREE DELIVERY
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                            Add ₹{amountForFreeDelivery.toFixed(0)} for Free Delivery
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                                    Fulfilling from {selectedStore ? selectedStore.store_name : 'T. Nagar Hub'} in 8 mins
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#10b981',
                            color: '#ffffff',
                            padding: '9px 16px',
                            borderRadius: 13,
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                        }}>
                            <span>View Basket</span>
                            <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
            )}

            {/* Apple-Style Minimalist Trust Footer */}
            <footer style={{
                borderTop: '1px solid rgba(15, 23, 42, 0.06)',
                background: '#ffffff',
                padding: '28px 28px',
                marginTop: 'auto'
            }}>
                <div style={{
                    maxWidth: 1380,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    fontSize: '0.78rem',
                    color: '#64748b'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>QuickKart Commerce</span>
                        <span>•</span>
                        <span>3NF Normalized Relational Schema</span>
                        <span>•</span>
                        <span>InnoDB Pessimistic Row-Level Stock Locking</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#0ca678', fontWeight: 700 }}>
                            <ShieldCheck size={14} /> 100% ACID Verified Checkout
                        </span>
                        <span>Chennai Dark Stores: T. Nagar • Adyar • Velachery • Anna Nagar</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
