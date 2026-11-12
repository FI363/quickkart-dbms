/**
 * QuickKart: Quick-Commerce Management System
 * Flagship Shopping Cart Slide-out Drawer — Apple HIG × Blinkit/Zepto Checkout
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
    X,
    Trash2,
    Plus,
    Minus,
    MapPin,
    CreditCard,
    ShieldCheck,
    ArrowRight,
    Zap,
    ShoppingBag,
    Sparkles,
    Receipt
} from 'lucide-react';

export default function CartDrawer() {
    const {
        isCartOpen,
        setIsCartOpen,
        cart,
        addToCart,
        removeFromCart,
        placeOrder,
        addresses,
        selectedAddressId,
        setSelectedAddressId,
        selectedStore
    } = useApp();

    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [isPlacing, setIsPlacing] = useState(false);

    if (!isCartOpen) return null;

    const subtotal = Number(cart.subtotal || 0);
    const deliveryFee = Number(cart.deliveryFee ?? (subtotal >= 199 || subtotal === 0 ? 0 : 15));
    const totalAmount = Number(cart.totalAmount ?? (subtotal + deliveryFee));
    const freeDeliveryTarget = 199;
    const progressPct = Math.min(100, Math.round((subtotal / freeDeliveryTarget) * 100));
    const remainingForFree = Math.max(0, freeDeliveryTarget - subtotal);

    const handleCheckout = async () => {
        setIsPlacing(true);
        try {
            await placeOrder(paymentMethod);
        } catch (e) {
            // error toast shown by context
        } finally {
            setIsPlacing(false);
        }
    };

    return (
        <div className="drawer-overlay" onClick={() => setIsCartOpen(false)}>
            <div
                className="drawer-panel"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 450,
                    background: '#f5f5f7',
                    boxShadow: '-16px 0 40px rgba(15, 23, 42, 0.18)'
                }}
            >
                {/* Sticky Glass Header */}
                <div style={{
                    padding: '18px 22px',
                    background: 'rgba(255, 255, 255, 0.88)',
                    backdropFilter: 'saturate(180%) blur(20px)',
                    borderBottom: '1px solid rgba(15, 23, 42, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 11,
                            background: '#e6fcf5',
                            color: '#0ca678',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ShoppingBag size={18} strokeWidth={2.4} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                Your Basket
                            </h2>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                Fulfilling from <strong style={{ color: '#0f172a' }}>{selectedStore ? selectedStore.store_name : 'T. Nagar Hub'}</strong>
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCartOpen(false)}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#475569'
                        }}
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
                    {(!cart.items || cart.items.length === 0) ? (
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 22,
                            padding: '56px 24px',
                            textAlign: 'center',
                            border: '1px solid rgba(15, 23, 42, 0.05)',
                            marginTop: 12
                        }}>
                            <div style={{
                                width: 68,
                                height: 68,
                                borderRadius: 22,
                                background: '#f0fdf4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                margin: '0 auto 16px'
                            }}>
                                🛒
                            </div>
                            <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                                Your basket feels light
                            </h3>
                            <p style={{ fontSize: '0.84rem', color: '#64748b', maxWidth: 260, margin: '0 auto 20px', lineHeight: 1.5 }}>
                                Add farm-fresh milk, paneer, bread, or snacks for instant 8-minute doorstep delivery.
                            </p>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="qk-add-btn"
                                style={{ padding: '10px 22px' }}
                            >
                                Browse Groceries
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* 1. Free Delivery Progress Bar Banner */}
                            <div style={{
                                background: '#ffffff',
                                padding: '14px 16px',
                                borderRadius: 16,
                                border: '1px solid rgba(15, 23, 42, 0.06)',
                                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    marginBottom: 8
                                }}>
                                    {remainingForFree === 0 ? (
                                        <span style={{ color: '#0ca678', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Sparkles size={14} /> Yay! You unlocked FREE delivery
                                        </span>
                                    ) : (
                                        <span style={{ color: '#334155' }}>
                                            Add <strong style={{ color: '#0ca678' }}>₹{remainingForFree.toFixed(0)}</strong> more for <strong>FREE Delivery</strong>
                                        </span>
                                    )}
                                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{progressPct}%</span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: 6,
                                    background: '#f1f5f9',
                                    borderRadius: 999,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${progressPct}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                        borderRadius: 999,
                                        transition: 'width 300ms ease'
                                    }} />
                                </div>
                            </div>

                            {/* 2. 8-Minute Express SLA Promise Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                padding: '12px 16px',
                                borderRadius: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#059669',
                                    flexShrink: 0
                                }}>
                                    <Zap size={18} fill="#10b981" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#065f46' }}>
                                        Delivery in 8 – 10 minutes
                                    </div>
                                    <div style={{ fontSize: '0.73rem', color: '#047857', fontWeight: 500 }}>
                                        Shipment of {cart.items.reduce((s, i) => s + i.quantity, 0)} items from {selectedStore ? selectedStore.area : 'T. Nagar'}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Grouped Items List */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: 18,
                                padding: '6px 14px',
                                border: '1px solid rgba(15, 23, 42, 0.06)'
                            }}>
                                {cart.items.map((item, idx) => (
                                    <div
                                        key={item.variant_id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '12px 0',
                                            borderBottom: idx === cart.items.length - 1 ? 'none' : '1px solid rgba(15, 23, 42, 0.06)'
                                        }}
                                    >
                                        <img
                                            src={item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                                            alt={item.product_name}
                                            style={{
                                                width: 52,
                                                height: 52,
                                                objectFit: 'cover',
                                                borderRadius: 12,
                                                background: '#f8fafc',
                                                border: '1px solid rgba(15,23,42,0.05)'
                                            }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '0.86rem',
                                                fontWeight: 700,
                                                color: '#0f172a',
                                                lineHeight: 1.25,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {item.product_name}
                                            </div>
                                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                                                {item.unit || item.variant_name} • ₹{item.price}
                                            </div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: 3 }}>
                                                ₹{item.item_subtotal}
                                            </div>
                                        </div>

                                        {/* Stepper */}
                                        <div className="qk-stepper" style={{ minWidth: 84, padding: '5px 8px' }}>
                                            <button
                                                onClick={() => item.quantity === 1
                                                    ? removeFromCart(item.variant_id)
                                                    : addToCart({ variant_id: item.variant_id, price: item.price }, { product_name: item.product_name, image_url: item.image_url }, item.quantity - 1)
                                                }
                                                className="qk-stepper-btn"
                                            >
                                                {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} strokeWidth={2.8} />}
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button
                                                onClick={() => addToCart({ variant_id: item.variant_id, price: item.price }, { product_name: item.product_name, image_url: item.image_url }, item.quantity + 1)}
                                                className="qk-stepper-btn"
                                            >
                                                <Plus size={13} strokeWidth={2.8} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 4. Delivery Address Selector */}
                            <div style={{
                                background: '#ffffff',
                                padding: 16,
                                borderRadius: 18,
                                border: '1px solid rgba(15, 23, 42, 0.06)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    color: '#0f172a',
                                    marginBottom: 10
                                }}>
                                    <MapPin size={15} color="#0ca678" />
                                    <span>DELIVERY ADDRESS</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {addresses.map(addr => {
                                        const isSelected = selectedAddressId === addr.address_id;
                                        return (
                                            <label
                                                key={addr.address_id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 10,
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    padding: '10px 12px',
                                                    borderRadius: 12,
                                                    background: isSelected ? '#f0fdf4' : '#f8fafc',
                                                    border: isSelected ? '1.5px solid #0ca678' : '1.5px solid transparent',
                                                    transition: 'all 150ms ease'
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="delivery_address"
                                                    checked={isSelected}
                                                    onChange={() => setSelectedAddressId(addr.address_id)}
                                                    style={{ marginTop: 3, accentColor: '#0ca678' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{addr.area}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                        {addr.address_line}, {addr.pincode}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 5. Payment Method Selector */}
                            <div style={{
                                background: '#ffffff',
                                padding: 16,
                                borderRadius: 18,
                                border: '1px solid rgba(15, 23, 42, 0.06)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    color: '#0f172a',
                                    marginBottom: 10
                                }}>
                                    <CreditCard size={15} color="#7950f2" />
                                    <span>PAYMENT MODE</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                    {[
                                        { id: 'UPI', label: 'Instant UPI' },
                                        { id: 'CREDIT_CARD', label: 'Card' },
                                        { id: 'COD', label: 'Cash / COD' }
                                    ].map(m => {
                                        const active = paymentMethod === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setPaymentMethod(m.id)}
                                                style={{
                                                    padding: '9px 10px',
                                                    borderRadius: 11,
                                                    border: '1.5px solid',
                                                    borderColor: active ? '#0ca678' : '#e2e8f0',
                                                    background: active ? '#f0fdf4' : '#ffffff',
                                                    color: active ? '#087f5b' : '#475569',
                                                    fontWeight: active ? 800 : 600,
                                                    fontSize: '0.76rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 150ms ease'
                                                }}
                                            >
                                                {m.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 6. Bill Summary Receipt */}
                            <div style={{
                                background: '#ffffff',
                                padding: 16,
                                borderRadius: 18,
                                border: '1px solid rgba(15, 23, 42, 0.06)',
                                fontSize: '0.82rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                                    <Receipt size={15} color="#64748b" />
                                    <span>BILL DETAILS</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                    <span>Item Total</span>
                                    <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                    <span>Delivery Partner Fee</span>
                                    <span>
                                        {deliveryFee === 0 ? (
                                            <span>
                                                <s style={{ color: '#94a3b8', marginRight: 4 }}>₹15</s>
                                                <strong style={{ color: '#0ca678' }}>FREE</strong>
                                            </span>
                                        ) : (
                                            `₹${deliveryFee.toFixed(2)}`
                                        )}
                                    </span>
                                </div>
                                <div style={{ borderTop: '1px dashed #e2e8f0', margin: '4px 0' }} />
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    color: '#0f172a'
                                }}>
                                    <span>Grand Total</span>
                                    <span>₹{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Checkout Footer */}
                {cart.items && cart.items.length > 0 && (
                    <div style={{
                        padding: '16px 20px',
                        background: '#ffffff',
                        borderTop: '1px solid rgba(15, 23, 42, 0.08)'
                    }}>
                        <button
                            disabled={isPlacing}
                            onClick={handleCheckout}
                            className="qk-cart-trigger"
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                borderRadius: 16,
                                fontSize: '0.96rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                                <span style={{ fontSize: '1rem', fontWeight: 800 }}>₹{totalAmount.toFixed(2)}</span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 600, opacity: 0.9 }}>TOTAL TO PAY</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{isPlacing ? 'Locking Stock...' : 'Place 8-Min Order'}</span>
                                <ArrowRight size={18} />
                            </div>
                        </button>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            marginTop: 8,
                            fontSize: '0.7rem',
                            color: '#64748b',
                            fontWeight: 600
                        }}>
                            <ShieldCheck size={13} color="#0ca678" />
                            <span>ACID Atomic Checkout • Pessimistic Row Lock (sp_place_order)</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
