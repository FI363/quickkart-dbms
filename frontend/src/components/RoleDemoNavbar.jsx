/**
 * QuickKart: Quick-Commerce Management System
 * Role Demo Switcher & Hub Selector Bar
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Store, Bike, BarChart3, Database, MapPin, NotebookPen, ShoppingBag } from 'lucide-react';

export default function RoleDemoNavbar() {
    const { currentRole, setCurrentRole, stores, selectedStore, setSelectedStore } = useApp();

    const roles = [
        { id: 'NOTEBOOK', label: 'Schema Notebook', icon: NotebookPen, color: '#e67700' },
        { id: 'CUSTOMER', label: 'Customer View', icon: ShoppingCart, color: '#0ca678' },
        { id: 'STORE_MANAGER', label: 'Store Manager', icon: Store, color: '#ff922b' },
        { id: 'DELIVERY_PARTNER', label: 'Delivery Rider', icon: Bike, color: '#228be6' },
        { id: 'ADMIN', label: 'Executive Admin', icon: BarChart3, color: '#7950f2' },
        { id: 'SALES_DB', label: 'Sales DB', icon: ShoppingBag, color: '#0ca678' }
    ];

    return (
        <div style={{
            background: 'var(--bg-dark)',
            color: 'white',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.85rem'
        }}>
            {/* Project Title & DB Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, letterSpacing: '0.02em' }}>
                    <Database size={16} color="#20c997" />
                    <span>QuickKart DBMS</span>
                    <span style={{
                        background: 'rgba(32, 201, 151, 0.2)',
                        color: '#20c997',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 600
                    }}>
                        MySQL 8.0 • 3NF
                    </span>
                </div>

                {/* Dark Store Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
                    <MapPin size={14} color="#fcc419" />
                    <span>Fulfillment Hub:</span>
                    <select
                        value={selectedStore ? selectedStore.store_id : ''}
                        onChange={(e) => {
                            const found = stores.find(s => s.store_id === parseInt(e.target.value, 10));
                            if (found) setSelectedStore(found);
                        }}
                        style={{
                            background: 'var(--bg-dark-surface)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '3px 8px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        {stores.map(store => (
                            <option key={store.store_id} value={store.store_id}>
                                {store.store_name} ({store.area})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Role Persona Switcher Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', marginRight: 4 }}>Role Persona:</span>
                {roles.map(r => {
                    const Icon = r.icon;
                    const isActive = currentRole === r.id;
                    return (
                        <button
                            key={r.id}
                            onClick={() => setCurrentRole(r.id)}
                            style={{
                                background: isActive ? r.color : 'rgba(255, 255, 255, 0.08)',
                                color: 'white',
                                border: 'none',
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-full)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: isActive ? 700 : 500,
                                transition: 'all 150ms ease',
                                boxShadow: isActive ? `0 2px 8px ${r.color}50` : 'none'
                            }}
                        >
                            <Icon size={14} />
                            <span>{r.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
