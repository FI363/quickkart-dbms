/**
 * QuickKart: Quick-Commerce Management System
 * Main Application Orchestrator
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import RoleDemoNavbar from './components/RoleDemoNavbar';
import CustomerLayout from './layouts/CustomerLayout';
import ShopPage from './pages/customer/ShopPage';
import CartDrawer from './pages/customer/CartDrawer';
import OrderTrackingModal from './pages/customer/OrderTrackingModal';
import AdminDashboard from './pages/admin/AdminDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import SchemaNotebookPage from './pages/notebook/SchemaNotebookPage';
import SalesDatabasePage from './pages/sales/SalesDatabasePage';

function MainContent() {
    const { currentRole } = useApp();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <RoleDemoNavbar />

            {/* Interactive Apple-Notes-Style Schema Notebook Canvas */}
            {currentRole === 'NOTEBOOK' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <SchemaNotebookPage />
                </div>
            )}

            {/* Render Interface matching Current Selected Persona */}
            {currentRole === 'CUSTOMER' && (
                <CustomerLayout onSearch={setSearchQuery} searchQuery={searchQuery}>
                    <ShopPage searchQuery={searchQuery} />
                    <CartDrawer />
                    <OrderTrackingModal />
                </CustomerLayout>
            )}

            {(currentRole === 'STORE_MANAGER' || currentRole === 'ADMIN') && (
                <div style={{ flex: 1, background: 'var(--bg-main)' }}>
                    <AdminDashboard />
                </div>
            )}

            {currentRole === 'DELIVERY_PARTNER' && (
                <div style={{ flex: 1, background: 'var(--bg-main)' }}>
                    <DeliveryDashboard />
                </div>
            )}

            {/* Live Sold Products & Revenue Database (Sell DB) */}
            {currentRole === 'SALES_DB' && (
                <div style={{ flex: 1, background: 'var(--bg-main)' }}>
                    <SalesDatabasePage />
                </div>
            )}
        </div>
    );
}

export default function App() {
    return (
        <AppProvider>
            <MainContent />
        </AppProvider>
    );
}
