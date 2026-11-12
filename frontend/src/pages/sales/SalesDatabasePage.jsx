/**
 * QuickKart: Quick-Commerce Management System
 * DBA Relational Records & Sales Database Explorer
 * Real-time 3NF Relational Audit of Sales, Customers, Products, Orders, Payments & Deliveries
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
    ShoppingBag, 
    Search, 
    Filter, 
    DollarSign, 
    Package, 
    Store, 
    CheckCircle2, 
    Clock, 
    Truck, 
    XCircle, 
    Database, 
    ArrowUpDown, 
    RefreshCw,
    Tag,
    Users,
    CreditCard,
    ClipboardList,
    Sparkles,
    Terminal,
    Copy,
    Check
} from 'lucide-react';

export default function SalesDatabasePage() {
    const { stores, showToast } = useApp();

    // Active Database Entity Tab: 'sales' | 'customer' | 'product' | 'order' | 'payment' | 'delivery'
    const [activeEntity, setActiveEntity] = useState('sales');
    const [copiedCmd, setCopiedCmd] = useState(null);

    // Sales data state
    const [soldItems, setSoldItems] = useState([]);
    const [summary, setSummary] = useState({ totalSoldQuantity: 0, totalRevenue: 0, distinctProductsCount: 0 });
    const [topProducts, setTopProducts] = useState([]);

    // DBA Records state (Customers, Products, Orders, Payments, Deliveries)
    const [dbaData, setDbaData] = useState({
        customers: [],
        addresses: [],
        products: [],
        orders: [],
        payments: [],
        refunds: [],
        deliveries: [],
        fleet: []
    });

    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [storeFilter, setStoreFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('date-desc');

    useEffect(() => {
        loadAllRecords();
    }, [storeFilter]);

    async function loadAllRecords() {
        setIsLoading(true);
        try {
            const params = {};
            if (storeFilter !== 'ALL') {
                params.storeId = storeFilter;
            }
            const [soldRes, dbaRes] = await Promise.all([
                api.getSoldProducts(params),
                api.getDbaRecords()
            ]);

            if (soldRes && soldRes.data) {
                setSoldItems(soldRes.data);
                if (soldRes.summary) setSummary(soldRes.summary);
                if (soldRes.topProducts) setTopProducts(soldRes.topProducts);
            }
            if (dbaRes && dbaRes.data) {
                setDbaData(dbaRes.data);
            }
        } catch (err) {
            console.error('Failed to load DBA records:', err);
        } finally {
            setIsLoading(false);
        }
    }

    const handleCopyCommand = (cmd) => {
        navigator.clipboard?.writeText(cmd);
        setCopiedCmd(cmd);
        if (showToast) showToast(`Copied terminal command: ${cmd}`);
        setTimeout(() => setCopiedCmd(null), 2000);
    };

    const entityTabs = [
        { id: 'sales', label: 'Sales Ledger', cmd: 'node dba.js sales', icon: ShoppingBag, count: soldItems.length, color: '#0ca678' },
        { id: 'customer', label: 'Customers', cmd: 'node dba.js customer', icon: Users, count: dbaData.customers.length, color: '#228be6' },
        { id: 'product', label: 'Products & SKUs', cmd: 'node dba.js product', icon: Package, count: dbaData.products.length, color: '#7950f2' },
        { id: 'order', label: 'Orders', cmd: 'node dba.js order', icon: ClipboardList, count: dbaData.orders.length, color: '#f59f00' },
        { id: 'payment', label: 'Payments', cmd: 'node dba.js payment', icon: CreditCard, count: dbaData.payments.length, color: '#e64980' },
        { id: 'delivery', label: 'Deliveries & Fleet', cmd: 'node dba.js delivery', icon: Truck, count: dbaData.deliveries.length, color: '#15aabf' }
    ];

    const currentTabObj = entityTabs.find(t => t.id === activeEntity) || entityTabs[0];

    // Helper for status badge
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'DELIVERED':
            case 'SUCCESS':
            case 'ACTIVE':
            case 'AVAILABLE':
            case 'PROCESSED':
                return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} /> {status}</span>;
            case 'OUT_FOR_DELIVERY':
            case 'PICKED_UP':
            case 'ASSIGNED':
                return <span className="badge" style={{ background: '#e7f5ff', color: '#1971c2', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Truck size={12} /> {status}</span>;
            case 'CONFIRMED':
            case 'PACKING':
            case 'PENDING':
            case 'BUSY':
                return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {status}</span>;
            case 'CANCELLED':
            case 'FAILED':
            case 'REFUNDED':
                return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><XCircle size={12} /> {status}</span>;
            default:
                return <span className="badge badge-secondary">{status}</span>;
        }
    };

    const q = searchQuery.toLowerCase().trim();

    // Filtered datasets per tab
    const filteredSales = soldItems
        .filter(item => {
            const matchesSearch = !q ||
                (item.product_name && item.product_name.toLowerCase().includes(q)) ||
                (item.variant_name && item.variant_name.toLowerCase().includes(q)) ||
                (item.order_number && item.order_number.toLowerCase().includes(q)) ||
                (item.customer_name && item.customer_name.toLowerCase().includes(q)) ||
                (item.store_name && item.store_name.toLowerCase().includes(q));
            const matchesStatus = statusFilter === 'ALL' || item.order_status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'amount-desc') return Number(b.total_amount) - Number(a.total_amount);
            if (sortBy === 'qty-desc') return Number(b.quantity) - Number(a.quantity);
            return new Date(b.sale_date) - new Date(a.sale_date);
        });

    const filteredCustomers = dbaData.customers.filter(c =>
        !q ||
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.role_name?.toLowerCase().includes(q) ||
        c.area?.toLowerCase().includes(q)
    );

    const filteredProducts = dbaData.products.filter(p =>
        !q ||
        p.product_name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand_name?.toLowerCase().includes(q) ||
        p.category_name?.toLowerCase().includes(q) ||
        p.variant_name?.toLowerCase().includes(q)
    );

    const filteredOrders = dbaData.orders.filter(o =>
        !q ||
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.store_name?.toLowerCase().includes(q) ||
        o.order_status?.toLowerCase().includes(q)
    );

    const filteredPayments = dbaData.payments.filter(p =>
        !q ||
        p.order_number?.toLowerCase().includes(q) ||
        p.customer_name?.toLowerCase().includes(q) ||
        p.transaction_reference?.toLowerCase().includes(q) ||
        p.payment_method?.toLowerCase().includes(q) ||
        p.payment_status?.toLowerCase().includes(q)
    );

    const filteredDeliveries = dbaData.deliveries.filter(d =>
        !q ||
        d.order_number?.toLowerCase().includes(q) ||
        d.partner_name?.toLowerCase().includes(q) ||
        d.customer_name?.toLowerCase().includes(q) ||
        d.store_area?.toLowerCase().includes(q) ||
        d.delivery_status?.toLowerCase().includes(q)
    );

    return (
        <div style={{ maxWidth: 1420, margin: '0 auto', padding: '24px 24px 60px' }}>
            {/* Header Hero Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #0b132b 0%, #1c2541 45%, #0b7285 100%)',
                color: 'white',
                padding: '28px 32px',
                borderRadius: 'var(--radius-xl)',
                marginBottom: 24,
                boxShadow: '0 12px 32px rgba(11, 19, 43, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 20
            }}>
                <div>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(32, 201, 151, 0.2)',
                        color: '#20c997',
                        border: '1px solid rgba(32, 201, 151, 0.35)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        marginBottom: 10
                    }}>
                        <Database size={13} />
                        <span>DATABASE ADMINISTRATOR (DBA) LIVE EXPLORER • 3NF MYSQL</span>
                    </div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
                        DBA Master Records & Sales Database 🗄️
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', maxWidth: 680 }}>
                        Inspect live relational tuples across <strong>Sales</strong>, <strong>Customers</strong>, <strong>Products</strong>, <strong>Orders</strong>, <strong>Payments</strong>, and <strong>Deliveries</strong> — synchronized with the terminal CLI (<code>node dba.js</code>).
                    </p>
                </div>

                {/* Terminal Command Badge + Refresh */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div
                        onClick={() => handleCopyCommand(currentTabObj.cmd)}
                        title="Click to copy terminal command"
                        style={{
                            background: 'rgba(0, 0, 0, 0.45)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            padding: '10px 16px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            color: '#63e6be'
                        }}
                    >
                        <Terminal size={15} />
                        <span>$ {currentTabObj.cmd}</span>
                        {copiedCmd === currentTabObj.cmd ? <Check size={14} color="#20c997" /> : <Copy size={14} color="#94a3b8" />}
                    </div>

                    <button
                        onClick={loadAllRecords}
                        disabled={isLoading}
                        style={{
                            background: '#20c997',
                            color: '#0b132b',
                            border: 'none',
                            padding: '10px 18px',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 12px rgba(32, 201, 151, 0.3)'
                        }}
                    >
                        <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
                        <span>Refresh DB</span>
                    </button>
                </div>
            </div>

            {/* Entity Navigation Tabs (Sales | Customer | Product | Order | Payment | Delivery) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginBottom: 24
            }}>
                {entityTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeEntity === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveEntity(tab.id);
                                setSearchQuery('');
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 18px',
                                borderRadius: 'var(--radius-lg)',
                                border: isActive ? `2px solid ${tab.color}` : '1px solid var(--border-light)',
                                background: isActive ? 'white' : '#f8fafc',
                                cursor: 'pointer',
                                boxShadow: isActive ? `0 6px 18px ${tab.color}22` : 'none',
                                transition: 'all 150ms ease',
                                textAlign: 'left'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    background: isActive ? tab.color : '#e9ecef',
                                    color: isActive ? 'white' : '#495057',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        {tab.label}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                        {tab.cmd}
                                    </div>
                                </div>
                            </div>
                            <span style={{
                                background: isActive ? `${tab.color}18` : '#e9ecef',
                                color: isActive ? tab.color : '#495057',
                                padding: '3px 9px',
                                borderRadius: 999,
                                fontSize: '0.78rem',
                                fontWeight: 800
                            }}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Filter & Search Bar */}
            <div className="card" style={{ padding: '14px 20px', marginBottom: 20, background: 'white' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14
                }}>
                    <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: 460 }}>
                        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder={`Search ${currentTabObj.label.toLowerCase()} records...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 36px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-light)',
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>

                    {activeEntity === 'sales' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                                <Store size={14} color="var(--text-muted)" />
                                <select
                                    value={storeFilter}
                                    onChange={(e) => setStoreFilter(e.target.value)}
                                    style={{ padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.82rem', background: 'white' }}
                                >
                                    <option value="ALL">All Dark Stores</option>
                                    {stores.map(s => (
                                        <option key={s.store_id} value={s.store_id}>{s.store_name} ({s.area})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                                <Filter size={14} color="var(--text-muted)" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{ padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.82rem', background: 'white' }}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                                <ArrowUpDown size={14} color="var(--text-muted)" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    style={{ padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.82rem', background: 'white' }}
                                >
                                    <option value="date-desc">Newest First</option>
                                    <option value="amount-desc">Highest Amount (₹)</option>
                                    <option value="qty-desc">Highest Quantity</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ================================================================= */}
            {/* TAB 1: SALES LEDGER (node dba.js sales)                           */}
            {/* ================================================================= */}
            {activeEntity === 'sales' && (
                <>
                    {/* Top Best-Selling Products Leaderboard */}
                    {topProducts.length > 0 && (
                        <div className="card" style={{ padding: '20px 24px', marginBottom: 24, background: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                <Sparkles size={18} color="#f59f00" />
                                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
                                    Top Best-Selling Products by Revenue (Total Sold: ₹{summary.totalRevenue} • {summary.totalSoldQuantity} units)
                                </h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
                                {topProducts.slice(0, 4).map((prod, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                                        <img
                                            src={prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                                            alt={prod.product_name}
                                            style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.product_name}</div>
                                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{prod.units_sold} units • {prod.orders_count || 1} orders</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0ca678' }}>₹{prod.total_amount}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                                <ShoppingBag size={18} color="#0ca678" />
                                <span>Sold Products Ledger ({filteredSales.length} line-items)</span>
                            </div>
                            <span style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                SQL: order_items ⋈ orders ⋈ dark_stores ⋈ users
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ padding: '12px 14px' }}>ID</th>
                                        <th style={{ padding: '12px 14px' }}>Sold Product & Variant</th>
                                        <th style={{ padding: '12px 14px' }}>Order #</th>
                                        <th style={{ padding: '12px 14px' }}>Customer</th>
                                        <th style={{ padding: '12px 14px' }}>Hub Store</th>
                                        <th style={{ padding: '12px 14px' }}>Unit Price</th>
                                        <th style={{ padding: '12px 14px' }}>Qty Sold</th>
                                        <th style={{ padding: '12px 14px', color: '#0ca678' }}>Total Amount</th>
                                        <th style={{ padding: '12px 14px' }}>Status</th>
                                        <th style={{ padding: '12px 14px' }}>Sale Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSales.map((item, idx) => (
                                        <tr key={item.order_item_id || idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.order_item_id}</td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.variant_name}</div>
                                            </td>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700 }}>{item.order_number}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>{item.customer_name}</td>
                                            <td style={{ padding: '12px 14px' }}>{item.store_name} ({item.store_area})</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>₹{item.unit_price}</td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{ background: '#e7f5ff', color: '#1971c2', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>{item.quantity}x</span>
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0ca678', fontSize: '0.95rem' }}>₹{item.total_amount}</td>
                                            <td style={{ padding: '12px 14px' }}>{renderStatusBadge(item.order_status)}</td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                {item.sale_date ? new Date(item.sale_date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ================================================================= */}
            {/* TAB 2: CUSTOMERS & ADDRESSES (node dba.js customer)               */}
            {/* ================================================================= */}
            {activeEntity === 'customer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                                <Users size={18} color="#228be6" />
                                <span>Registered Customers & Users Directory ({filteredCustomers.length} users)</span>
                            </div>
                            <span style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                SQL: users ⋈ roles ⋈ addresses ⋈ orders
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ padding: '12px 14px' }}>User ID</th>
                                        <th style={{ padding: '12px 14px' }}>Full Name</th>
                                        <th style={{ padding: '12px 14px' }}>Role</th>
                                        <th style={{ padding: '12px 14px' }}>Email</th>
                                        <th style={{ padding: '12px 14px' }}>Phone</th>
                                        <th style={{ padding: '12px 14px' }}>Primary Area & Pincode</th>
                                        <th style={{ padding: '12px 14px' }}>Orders Placed</th>
                                        <th style={{ padding: '12px 14px', color: '#0ca678' }}>Lifetime Spend</th>
                                        <th style={{ padding: '12px 14px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map(c => (
                                        <tr key={c.user_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700 }}>#{c.user_id}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700 }}>{c.full_name}</td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{ background: '#f3f0ff', color: '#7950f2', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {c.role_name}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{c.email}</td>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>{c.phone}</td>
                                            <td style={{ padding: '12px 14px' }}>{c.area}, {c.city} - {c.pincode}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700 }}>{c.orders_placed} orders</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0ca678' }}>₹{c.lifetime_spend}</td>
                                            <td style={{ padding: '12px 14px' }}>{renderStatusBadge(c.account_status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Saved Customer Delivery Addresses Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                                <Store size={18} color="#228be6" />
                                <span>Customer Delivery Addresses Table ({dbaData.addresses.length} addresses)</span>
                            </div>
                            <span style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                SQL: addresses ⋈ users (3NF Entity)
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ padding: '12px 14px' }}>Addr ID</th>
                                        <th style={{ padding: '12px 14px' }}>Customer Name</th>
                                        <th style={{ padding: '12px 14px' }}>Type</th>
                                        <th style={{ padding: '12px 14px' }}>Address Line</th>
                                        <th style={{ padding: '12px 14px' }}>Area</th>
                                        <th style={{ padding: '12px 14px' }}>Pincode</th>
                                        <th style={{ padding: '12px 14px' }}>Default</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dbaData.addresses.map(a => (
                                        <tr key={a.address_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>#{a.address_id}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700 }}>{a.customer_name}</td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span className="badge badge-secondary">{a.address_type}</span>
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>{a.address_line}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>{a.area}</td>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>{a.pincode}</td>
                                            <td style={{ padding: '12px 14px' }}>{a.is_default ? '✅ Default' : 'No'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* TAB 3: PRODUCTS & SKUS (node dba.js product)                      */}
            {/* ================================================================= */}
            {activeEntity === 'product' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                            <Package size={18} color="#7950f2" />
                            <span>Master Product & Variant SKU Catalogue ({filteredProducts.length} SKUs)</span>
                        </div>
                        <span style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            SQL: products ⋈ product_variants ⋈ categories ⋈ brands ⋈ store_inventory
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: '12px 14px' }}>Var ID</th>
                                    <th style={{ padding: '12px 14px' }}>SKU Code</th>
                                    <th style={{ padding: '12px 14px' }}>Product Name</th>
                                    <th style={{ padding: '12px 14px' }}>Brand</th>
                                    <th style={{ padding: '12px 14px' }}>Category</th>
                                    <th style={{ padding: '12px 14px' }}>Pack / Unit</th>
                                    <th style={{ padding: '12px 14px' }}>Price</th>
                                    <th style={{ padding: '12px 14px' }}>MRP</th>
                                    <th style={{ padding: '12px 14px' }}>Savings</th>
                                    <th style={{ padding: '12px 14px' }}>Available Stock (All Hubs)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.variant_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>#{p.variant_id}</td>
                                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#7950f2' }}>{p.sku}</td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {p.image_url && (
                                                    <img src={p.image_url} alt={p.product_name} style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover' }} />
                                                )}
                                                <span style={{ fontWeight: 700 }}>{p.product_name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{p.brand_name}</td>
                                        <td style={{ padding: '12px 14px' }}>{p.category_name}</td>
                                        <td style={{ padding: '12px 14px' }}>{p.variant_name} ({p.unit})</td>
                                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0ca678' }}>₹{p.price}</td>
                                        <td style={{ padding: '12px 14px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{p.mrp}</td>
                                        <td style={{ padding: '12px 14px', color: '#e67700', fontWeight: 700 }}>₹{p.discount} OFF</td>
                                        <td style={{ padding: '12px 14px', fontWeight: 800, color: p.available_stock > 0 ? '#0ca678' : 'var(--danger)' }}>
                                            {p.available_stock} units
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* TAB 4: ORDERS REGISTER (node dba.js order)                        */}
            {/* ================================================================= */}
            {activeEntity === 'order' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                            <ClipboardList size={18} color="#f59f00" />
                            <span>Master Customer Orders Register ({filteredOrders.length} orders)</span>
                        </div>
                        <span style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            SQL: orders ⋈ users ⋈ dark_stores ⋈ order_items
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: '12px 14px' }}>Order ID</th>
                                    <th style={{ padding: '12px 14px' }}>Order Number</th>
                                    <th style={{ padding: '12px 14px' }}>Customer</th>
                                    <th style={{ padding: '12px 14px' }}>Fulfillment Hub</th>
                                    <th style={{ padding: '12px 14px' }}>Items / Units</th>
                                    <th style={{ padding: '12px 14px' }}>Subtotal</th>
                                    <th style={{ padding: '12px 14px' }}>Delivery Fee</th>
                                    <th style={{ padding: '12px 14px', color: '#0ca678' }}>Total Amount</th>
                                    <th style={{ padding: '12px 14px' }}>Order Status</th>
                                    <th style={{ padding: '12px 14px' }}>Order Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(o => (
                                    <tr key={o.order_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>#{o.order_id}</td>
                                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 800 }}>{o.order_number}</td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ fontWeight: 700 }}>{o.customer_name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{o.customer_phone}</div>
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>{o.store_name} ({o.store_area})</td>
                                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{o.sku_count} SKUs ({o.total_units} units)</td>
                                        <td style={{ padding: '12px 14px' }}>₹{o.subtotal}</td>
                                        <td style={{ padding: '12px 14px' }}>₹{o.delivery_fee}</td>
                                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0ca678', fontSize: '0.95rem' }}>₹{o.total_amount}</td>
                                        <td style={{ padding: '12px 14px' }}>{renderStatusBadge(o.order_status)}</td>
                                        <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            {o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* TAB 5: PAYMENTS & REFUNDS (node dba.js payment)                   */}
            {/* ================================================================= */}
            {activeEntity === 'payment' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                                <CreditCard size={18} color="#e64980" />
                                <span>Payment Transactions Ledger ({filteredPayments.length} payments)</span>
                            </div>
                            <span style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                SQL: payments ⋈ orders ⋈ users
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ padding: '12px 14px' }}>Pay ID</th>
                                        <th style={{ padding: '12px 14px' }}>Transaction Reference</th>
                                        <th style={{ padding: '12px 14px' }}>Order Number</th>
                                        <th style={{ padding: '12px 14px' }}>Customer Name</th>
                                        <th style={{ padding: '12px 14px' }}>Method</th>
                                        <th style={{ padding: '12px 14px', color: '#0ca678' }}>Amount Paid</th>
                                        <th style={{ padding: '12px 14px' }}>Payment Status</th>
                                        <th style={{ padding: '12px 14px' }}>Order Status</th>
                                        <th style={{ padding: '12px 14px' }}>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map(p => (
                                        <tr key={p.payment_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>#{p.payment_id}</td>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#e64980' }}>{p.transaction_reference}</td>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700 }}>{p.order_number}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>{p.customer_name}</td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{ background: '#fff0f6', color: '#c2255c', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: '0.76rem' }}>
                                                    {p.payment_method}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0ca678', fontSize: '0.95rem' }}>₹{p.amount}</td>
                                            <td style={{ padding: '12px 14px' }}>{renderStatusBadge(p.payment_status)}</td>
                                            <td style={{ padding: '12px 14px' }}>{renderStatusBadge(p.order_status)}</td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                {p.payment_date ? new Date(p.payment_date).toLocaleString('en-IN') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {dbaData.refunds.length > 0 && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                                    <RefreshCw size={18} color="#e64980" />
                                    <span>Processed Refunds Ledger ({dbaData.refunds.length} refunds)</span>
                                </div>
                                <span style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                    SQL: refunds ⋈ payments ⋈ orders (sp_cancel_order)
                                </span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                            <th style={{ padding: '12px 14px' }}>Refund ID</th>
                                            <th style={{ padding: '12px 14px' }}>Refund Reference</th>
                                            <th style={{ padding: '12px 14px' }}>Order Number</th>
                                            <th style={{ padding: '12px 14px' }}>Refund Amount</th>
                                            <th style={{ padding: '12px 14px' }}>Reason</th>
                                            <th style={{ padding: '12px 14px' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dbaData.refunds.map(r => (
                                            <tr key={r.refund_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>#{r.refund_id}</td>
                                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700 }}>{r.refund_reference}</td>
                                                <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>{r.order_number}</td>
                                                <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--danger)' }}>₹{r.refund_amount}</td>
                                                <td style={{ padding: '12px 14px' }}>{r.refund_reason}</td>
                                                <td style={{ padding: '12px 14px' }}>{renderStatusBadge(r.refund_status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ================================================================= */}
            {/* TAB 6: DELIVERIES & FLEET (node dba.js delivery)                  */}
            {/* ================================================================= */}
            {activeEntity === 'delivery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                                <Truck size={18} color="#15aabf" />
                                <span>Order Delivery Dispatches ({filteredDeliveries.length} dispatches)</span>
                            </div>
                            <span style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                SQL: deliveries ⋈ orders ⋈ delivery_partners ⋈ users
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ padding: '12px 14px' }}>Deliv ID</th>
                                        <th style={{ padding: '12px 14px' }}>Order Number</th>
                                        <th style={{ padding: '12px 14px' }}>Customer</th>
                                        <th style={{ padding: '12px 14px' }}>Hub Store</th>
                                        <th style={{ padding: '12px 14px' }}>Assigned Rider</th>
                                        <th style={{ padding: '12px 14px' }}>Vehicle & Plate</th>
                                        <th style={{ padding: '12px 14px' }}>Delivery Status</th>
                                        <th style={{ padding: '12px 14px' }}>Assigned At</th>
                                        <th style={{ padding: '12px 14px' }}>Delivered At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDeliveries.map(d => (
                                        <tr key={d.delivery_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>#{d.delivery_id}</td>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 800 }}>{d.order_number}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>{d.customer_name}</td>
                                            <td style={{ padding: '12px 14px' }}>{d.store_name} ({d.store_area})</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700 }}>{d.partner_name}</td>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>{d.vehicle_type} ({d.vehicle_number})</td>
                                            <td style={{ padding: '12px 14px' }}>{renderStatusBadge(d.delivery_status)}</td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.78rem' }}>{d.assigned_at ? new Date(d.assigned_at).toLocaleString('en-IN') : '-'}</td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#0ca678', fontWeight: 700 }}>
                                                {d.delivered_at ? new Date(d.delivered_at).toLocaleString('en-IN') : 'In Transit'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Rider Fleet Roster & SLA Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                                <Users size={18} color="#15aabf" />
                                <span>Delivery Partner Fleet Roster & SLA (vw_delivery_performance)</span>
                            </div>
                            <span style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                View: vw_delivery_performance
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ padding: '12px 14px' }}>Rider ID</th>
                                        <th style={{ padding: '12px 14px' }}>Rider Name</th>
                                        <th style={{ padding: '12px 14px' }}>Phone</th>
                                        <th style={{ padding: '12px 14px' }}>Vehicle</th>
                                        <th style={{ padding: '12px 14px' }}>Availability</th>
                                        <th style={{ padding: '12px 14px' }}>Rating</th>
                                        <th style={{ padding: '12px 14px' }}>Completed Trips</th>
                                        <th style={{ padding: '12px 14px' }}>Avg Delivery Time</th>
                                        <th style={{ padding: '12px 14px' }}>SLA %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dbaData.fleet.map(f => (
                                        <tr key={f.partner_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>#{f.partner_id}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700 }}>{f.partner_name}</td>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>{f.partner_phone}</td>
                                            <td style={{ padding: '12px 14px' }}>{f.vehicle_type} ({f.vehicle_number})</td>
                                            <td style={{ padding: '12px 14px' }}>{renderStatusBadge(f.availability_status)}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 800, color: '#f59f00' }}>★ {f.rating}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700 }}>{f.completed_deliveries} / {f.total_assigned_deliveries}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0ca678' }}>{f.avg_delivery_minutes || 14} mins</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 800 }}>{f.completion_percentage || 100}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
