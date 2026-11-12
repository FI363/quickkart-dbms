/**
 * QuickKart: Quick-Commerce Management System
 * Real-Time Order Tracking & Cancellation Modal
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, Clock, Truck, ShieldAlert, Package, MapPin, AlertTriangle } from 'lucide-react';

export default function OrderTrackingModal() {
    const { trackingOrder, setTrackingOrder, cancelOrder } = useApp();
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    if (!trackingOrder) return null;

    const steps = [
        { id: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle2 },
        { id: 'PACKING', label: 'Packing at Hub', icon: Package },
        { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
        { id: 'DELIVERED', label: 'Delivered in 10m', icon: CheckCircle2 }
    ];

    const currentStatus = trackingOrder.order_status || 'CONFIRMED';
    const isCancelled = currentStatus === 'CANCELLED';

    const getStepState = (stepId, index) => {
        if (isCancelled) return 'cancelled';
        const orderIndex = steps.findIndex(s => s.id === currentStatus);
        if (index < orderIndex) return 'completed';
        if (index === orderIndex) return 'active';
        return 'pending';
    };

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await cancelOrder(trackingOrder.order_id, cancelReason || 'Customer requested cancellation from UI');
            setShowCancelConfirm(false);
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => setTrackingOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 28 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Order #{trackingOrder.order_number || 'ORD-2026-0001'}
                            </h2>
                            <span className={`badge ${isCancelled ? 'badge-danger' : 'badge-primary'}`}>
                                {currentStatus}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {trackingOrder.fulfillment_hub || 'QuickKart T. Nagar Hub'} • Express 10-Min Dispatch
                        </div>
                    </div>
                    <button
                        onClick={() => setTrackingOrder(null)}
                        style={{
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Live Delivery Progress Stepper */}
                <div style={{
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px 20px',
                    marginBottom: 24,
                    border: '1px solid var(--border-light)'
                }}>
                    {isCancelled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger)', fontWeight: 700 }}>
                            <AlertTriangle size={20} />
                            <span>This order was cancelled. Reserved stock was released back to store inventory via sp_cancel_order.</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                            {steps.map((step, index) => {
                                const state = getStepState(step.id, index);
                                const Icon = step.icon;
                                const isCurrent = state === 'active';
                                const isDone = state === 'completed';

                                return (
                                    <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 2 }}>
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            background: isDone || isCurrent ? 'var(--primary)' : 'white',
                                            color: isDone || isCurrent ? 'white' : 'var(--text-muted)',
                                            border: '2px solid',
                                            borderColor: isDone || isCurrent ? 'var(--primary)' : 'var(--border-light)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 6,
                                            boxShadow: isCurrent ? '0 0 0 4px var(--primary-light)' : 'none'
                                        }}>
                                            <Icon size={18} />
                                        </div>
                                        <div style={{
                                            fontSize: '0.72rem',
                                            fontWeight: isCurrent ? 800 : 600,
                                            color: isCurrent ? 'var(--primary-hover)' : isDone ? 'var(--text-primary)' : 'var(--text-muted)',
                                            textAlign: 'center'
                                        }}>
                                            {step.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Assigned Rider & Destination Details */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16,
                    marginBottom: 24
                }}>
                    <div style={{
                        padding: 14,
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        background: 'white'
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                            Delivery Partner
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {trackingOrder.delivery_partner_name || 'Murugan Selvam'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Vehicle: {trackingOrder.partner_vehicle || 'EV Scooter (TN 09 BX 1234)'} • 4.9★
                        </div>
                    </div>

                    <div style={{
                        padding: 14,
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        background: 'white'
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                            Delivery Location Snapshot
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                            {trackingOrder.delivery_address_snapshot || 'Flat 3B, Pondy Bazaar, T. Nagar, Chennai - 600017'}
                        </div>
                    </div>
                </div>

                {/* Items Snapshot Table */}
                {trackingOrder.items && trackingOrder.items.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                            Order Snapshot Items (3NF Historical Retention)
                        </div>
                        <div style={{
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ padding: '8px 12px' }}>Item</th>
                                        <th style={{ padding: '8px 12px' }}>Qty</th>
                                        <th style={{ padding: '8px 12px' }}>Snapshot Price</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trackingOrder.items.map((it, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '8px 12px' }}>{it.product_name_snapshot} ({it.variant_name_snapshot})</td>
                                            <td style={{ padding: '8px 12px' }}>{it.quantity}</td>
                                            <td style={{ padding: '8px 12px' }}>₹{it.unit_price}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>₹{it.subtotal}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Cancellation Controls */}
                {!isCancelled && (
                    <div style={{
                        paddingTop: 16,
                        borderTop: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        {!showCancelConfirm ? (
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                className="btn btn-danger btn-sm"
                            >
                                Cancel Order
                            </button>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                                <input
                                    type="text"
                                    placeholder="Reason for cancellation..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-light)',
                                        fontSize: '0.82rem'
                                    }}
                                />
                                <button
                                    disabled={isCancelling}
                                    onClick={handleCancel}
                                    className="btn btn-danger btn-sm"
                                >
                                    {isCancelling ? 'Releasing...' : 'Confirm Cancel'}
                                </button>
                                <button
                                    onClick={() => setShowCancelConfirm(false)}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Back
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setTrackingOrder(null)}
                            className="btn btn-secondary btn-sm"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
