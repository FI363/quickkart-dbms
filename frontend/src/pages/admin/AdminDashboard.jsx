/**
 * QuickKart: Quick-Commerce Management System
 * Store Manager & Admin Control Center
 * Manages Inventory, Restock (sp_add_inventory), Transfers (sp_transfer_inventory), and Analytics
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
    Layers, 
    AlertTriangle, 
    ArrowRightLeft, 
    TrendingUp, 
    RefreshCw, 
    Plus, 
    CheckCircle2, 
    Store,
    DollarSign,
    PackageCheck,
    Search
} from 'lucide-react';

export default function AdminDashboard() {
    const { stores, selectedStore, setSelectedStore, showToast } = useApp();
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'low-stock' | 'transfer' | 'sales'
    
    // Data states
    const [summary, setSummary] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [salesReports, setSalesReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [invSearch, setInvSearch] = useState('');

    // Restock modal state
    const [restockingItem, setRestockingItem] = useState(null);
    const [restockQty, setRestockQty] = useState(30);

    // Transfer form state
    const [transferSource, setTransferSource] = useState(4); // default Anna Nagar
    const [transferDest, setTransferDest] = useState(1);   // default T. Nagar
    const [transferVariant, setTransferVariant] = useState(1);
    const [transferQty, setTransferQty] = useState(15);
    const [transferNotes, setTransferNotes] = useState('Stock balancing between hubs');

    // Load metrics
    useEffect(() => {
        loadData();
    }, [selectedStore, activeTab]);

    async function loadData() {
        setIsLoading(true);
        try {
            // Summary KPIs
            const sumRes = await api.getSummary();
            if (sumRes.data) setSummary(sumRes.data);

            const storeId = selectedStore ? selectedStore.store_id : 1;

            if (activeTab === 'inventory') {
                const invRes = await api.getStoreInventory(storeId);
                if (invRes.data) setInventory(invRes.data);
            } else if (activeTab === 'low-stock') {
                const lowRes = await api.getLowStock(storeId);
                if (lowRes.data) setLowStockItems(lowRes.data);
            } else if (activeTab === 'sales') {
                const salesRes = await api.getDailySales(storeId);
                if (salesRes.data) setSalesReports(salesRes.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    // Handle restock execution (sp_add_inventory)
    const handleRestock = async () => {
        if (!restockingItem) return;
        try {
            const targetStoreId = restockingItem.store_id || (selectedStore ? selectedStore.store_id : 1);
            const res = await api.restockItem({
                storeId: targetStoreId,
                variantId: restockingItem.variant_id,
                quantity: parseInt(restockQty, 10),
                notes: 'Manual replenishment from Manager Dashboard'
            });
            showToast(res.message || 'Restocked successfully via sp_add_inventory!', 'success');
            setRestockingItem(null);
            await loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // Handle transfer execution (sp_transfer_inventory)
    const handleTransfer = async (e) => {
        e.preventDefault();
        try {
            const res = await api.transferStock({
                sourceStoreId: transferSource,
                destinationStoreId: transferDest,
                variantId: transferVariant,
                quantity: parseInt(transferQty, 10),
                notes: transferNotes
            });
            showToast(res.message || 'Transfer completed successfully via sp_transfer_inventory!', 'success');
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const filteredInventory = inventory.filter(i => 
        (i.product_name && i.product_name.toLowerCase().includes(invSearch.toLowerCase())) ||
        (i.variant_name && i.variant_name.toLowerCase().includes(invSearch.toLowerCase())) ||
        (i.sku && i.sku.toLowerCase().includes(invSearch.toLowerCase()))
    );

    return (
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px' }}>
            {/* Dashboard Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 16
            }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Fulfillment & Inventory Control Center
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Monitoring dark store stock, ACID procedures, and Chennai multi-hub rebalancing.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={loadData} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                        <RefreshCw size={14} />
                        <span>Refresh Data</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                marginBottom: 28
            }}>
                <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Settled Net Revenue
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                        ₹{summary ? summary.total_revenue.toFixed(2) : '8,450.00'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 4 }}>
                        • Live orders fulfilled
                    </div>
                </div>

                <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--accent-orange)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Low Stock Alerts
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-orange)', marginTop: 4 }}>
                        {summary ? summary.low_stock_alerts : lowStockItems.length || 2}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Items $\le$ reorder threshold
                    </div>
                </div>

                <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--accent-purple)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Active Dark Stores
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                        {stores.length || 4} Hubs
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', marginTop: 4 }}>
                        Chennai Metro Coverage
                    </div>
                </div>

                <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--accent-blue)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Available Fleet Riders
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                        {summary ? summary.available_riders : 4} Riders
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: 4 }}>
                        Ready for dispatch
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: 8,
                borderBottom: '1px solid var(--border-light)',
                marginBottom: 24
            }}>
                {[
                    { id: 'inventory', label: 'Store Inventory', icon: Layers },
                    { id: 'low-stock', label: 'Low Stock Alerts', icon: AlertTriangle, badge: lowStockItems.length || 2 },
                    { id: 'transfer', label: 'Inter-Store Transfer', icon: ArrowRightLeft },
                    { id: 'sales', label: 'Daily Sales (vw_daily_store_sales)', icon: TrendingUp }
                ].map(t => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                padding: '12px 20px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                fontWeight: isActive ? 800 : 600,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'all 150ms ease'
                            }}
                        >
                            <Icon size={16} />
                            <span>{t.label}</span>
                            {t.badge && (
                                <span style={{
                                    background: '#fff4e6',
                                    color: '#d9480f',
                                    padding: '2px 6px',
                                    borderRadius: 999,
                                    fontSize: '0.72rem',
                                    fontWeight: 800
                                }}>
                                    {t.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: STORE INVENTORY */}
            {activeTab === 'inventory' && (
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                                Live Hub Stock: {selectedStore ? selectedStore.store_name : 'T. Nagar'}
                            </h3>
                            <span className="badge badge-primary">3NF Store Isolation</span>
                        </div>

                        {/* Search in inventory */}
                        <div style={{ position: 'relative', width: 260 }}>
                            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Filter items or SKU..."
                                value={invSearch}
                                onChange={(e) => setInvSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 32px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-light)',
                                    fontSize: '0.85rem'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: '10px 14px' }}>Product</th>
                                    <th style={{ padding: '10px 14px' }}>SKU</th>
                                    <th style={{ padding: '10px 14px' }}>Unit</th>
                                    <th style={{ padding: '10px 14px' }}>Price</th>
                                    <th style={{ padding: '10px 14px' }}>Total (Q_tot)</th>
                                    <th style={{ padding: '10px 14px' }}>Reserved (Q_res)</th>
                                    <th style={{ padding: '10px 14px' }}>Available (Q_avail)</th>
                                    <th style={{ padding: '10px 14px' }}>Status</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.map((item, idx) => {
                                    const avail = item.available_quantity !== undefined ? item.available_quantity : (item.total_quantity - item.reserved_quantity);
                                    const isLow = avail <= 10;
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                                                {item.product_name}
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.brand_name}</div>
                                            </td>
                                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                                {item.sku}
                                            </td>
                                            <td style={{ padding: '10px 14px' }}>{item.unit}</td>
                                            <td style={{ padding: '10px 14px', fontWeight: 700 }}>₹{item.price}</td>
                                            <td style={{ padding: '10px 14px' }}>{item.total_quantity}</td>
                                            <td style={{ padding: '10px 14px', color: item.reserved_quantity > 0 ? '#d9480f' : 'inherit' }}>
                                                {item.reserved_quantity}
                                            </td>
                                            <td style={{ padding: '10px 14px', fontWeight: 800, color: isLow ? 'var(--danger)' : 'var(--primary)' }}>
                                                {avail}
                                            </td>
                                            <td style={{ padding: '10px 14px' }}>
                                                {avail <= 0 ? (
                                                    <span className="badge badge-danger">Empty</span>
                                                ) : isLow ? (
                                                    <span className="badge badge-warning">Low</span>
                                                ) : (
                                                    <span className="badge badge-success">Healthy</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => setRestockingItem(item)}
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                >
                                                    + Restock
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: LOW STOCK ALERTS */}
            {activeTab === 'low-stock' && (
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <AlertTriangle size={20} color="#d9480f" />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                            Low Stock Replenishment Manifest (vw_low_stock)
                        </h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: '10px 14px' }}>Dark Store</th>
                                    <th style={{ padding: '10px 14px' }}>Product</th>
                                    <th style={{ padding: '10px 14px' }}>SKU</th>
                                    <th style={{ padding: '10px 14px' }}>Current Total</th>
                                    <th style={{ padding: '10px 14px' }}>Reorder Level</th>
                                    <th style={{ padding: '10px 14px' }}>Suggested Inward</th>
                                    <th style={{ padding: '10px 14px' }}>Severity</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Trigger sp_add_inventory</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockItems.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '10px 14px' }}>{item.store_name} ({item.store_area})</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{item.product_name} ({item.unit})</td>
                                        <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{item.sku}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--danger)' }}>{item.total_quantity}</td>
                                        <td style={{ padding: '10px 14px' }}>{item.reorder_level}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--primary)' }}>
                                            +{item.recommended_reorder_qty} units
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span className="badge badge-warning">{item.alert_severity || 'LOW_STOCK'}</span>
                                        </td>
                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => {
                                                    setRestockingItem(item);
                                                    setRestockQty(item.recommended_reorder_qty || 30);
                                                }}
                                                className="btn btn-primary btn-sm"
                                            >
                                                ⚡ 1-Click Restock
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: INTER-STORE TRANSFER */}
            {activeTab === 'transfer' && (
                <div style={{ maxWidth: 680, margin: '0 auto' }} className="card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <ArrowRightLeft size={22} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                            Inter-Dark-Store Stock Transfer
                        </h3>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                        Rebalance stock between Chennai dark stores via stored procedure <code>sp_transfer_inventory</code>. 
                        Guarantees atomic reduction at source and increment at destination.
                    </p>

                    <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                                    Source Dark Store (Stock Out)
                                </label>
                                <select
                                    value={transferSource}
                                    onChange={(e) => setTransferSource(parseInt(e.target.value, 10))}
                                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                                >
                                    {stores.map(s => (
                                        <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                                    Destination Store (Stock In)
                                </label>
                                <select
                                    value={transferDest}
                                    onChange={(e) => setTransferDest(parseInt(e.target.value, 10))}
                                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                                >
                                    {stores.map(s => (
                                        <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                                    Product SKU Variant
                                </label>
                                <select
                                    value={transferVariant}
                                    onChange={(e) => setTransferVariant(parseInt(e.target.value, 10))}
                                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                                >
                                    <option value="1">Amul Taaza Milk 500ml (AML-MLK-500)</option>
                                    <option value="2">Amul Taaza Milk 1L (AML-MLK-1000)</option>
                                    <option value="4">Amul Malai Paneer 200g (AML-PAN-200)</option>
                                    <option value="7">Britannia Brown Bread 400g (BRT-BRD-400)</option>
                                    <option value="23">Tata Tea Premium 500g (TAT-TEA-500)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                                    Units Quantity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={transferQty}
                                    onChange={(e) => setTransferQty(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                                Transfer Justification Note
                            </label>
                            <input
                                type="text"
                                value={transferNotes}
                                onChange={(e) => setTransferNotes(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ padding: '12px', marginTop: 8 }}
                        >
                            Execute ACID Stock Transfer (sp_transfer_inventory)
                        </button>
                    </form>
                </div>
            )}

            {/* TAB 4: DAILY SALES REPORT */}
            {activeTab === 'sales' && (
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <TrendingUp size={20} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                            Daily Financial Performance (vw_daily_store_sales)
                        </h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: '10px 14px' }}>Date</th>
                                    <th style={{ padding: '10px 14px' }}>Fulfillment Hub</th>
                                    <th style={{ padding: '10px 14px' }}>Orders</th>
                                    <th style={{ padding: '10px 14px' }}>Delivered</th>
                                    <th style={{ padding: '10px 14px' }}>Gross GMV</th>
                                    <th style={{ padding: '10px 14px' }}>Net Revenue</th>
                                    <th style={{ padding: '10px 14px' }}>Avg Order Value (AOV)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesReports.map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{row.sale_date}</td>
                                        <td style={{ padding: '10px 14px' }}>{row.store_name}</td>
                                        <td style={{ padding: '10px 14px' }}>{row.total_orders}</td>
                                        <td style={{ padding: '10px 14px', color: 'var(--primary)', fontWeight: 700 }}>{row.delivered_orders}</td>
                                        <td style={{ padding: '10px 14px' }}>₹{row.gross_merchandise_value}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--text-primary)' }}>₹{row.net_settled_revenue}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>₹{row.average_order_value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {restockingItem && (
                <div className="modal-overlay" onClick={() => setRestockingItem(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 440 }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 8 }}>
                            Restock Inward Shipment
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                            Replenishing <strong>{restockingItem.product_name}</strong> ({restockingItem.variant_name || restockingItem.unit}) 
                            at {selectedStore ? selectedStore.store_name : 'T. Nagar Hub'}.
                        </p>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                                Units to Inward
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={restockQty}
                                onChange={(e) => setRestockQty(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setRestockingItem(null)} className="btn btn-secondary btn-sm">
                                Cancel
                            </button>
                            <button onClick={handleRestock} className="btn btn-primary btn-sm">
                                Confirm Restock (sp_add_inventory)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
