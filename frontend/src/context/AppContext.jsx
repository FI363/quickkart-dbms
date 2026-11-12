/**
 * QuickKart: Quick-Commerce Management System
 * Global Application Context & State Management
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // Current persona view for evaluation / demo ('NOTEBOOK' | 'CUSTOMER' | 'STORE_MANAGER' | 'DELIVERY_PARTNER' | 'ADMIN' | 'SALES_DB')
    const [currentRole, setCurrentRoleState] = useState(() => {
        localStorage.setItem('quickkart_role', 'ADMIN');
        return 'NOTEBOOK';
    });

    const resolveApiRole = (role) => (role === 'NOTEBOOK' || role === 'SALES_DB') ? 'ADMIN' : role;

    // Synchronously update localStorage before React mounts child views so child useEffects always send the active role
    const setCurrentRole = (nextRole) => {
        const apiRole = resolveApiRole(nextRole);
        localStorage.setItem('quickkart_role', apiRole);
        setCurrentRoleState(nextRole);
    };

    // Ensure localStorage stays synced on every render
    localStorage.setItem('quickkart_role', resolveApiRole(currentRole));
    
    // Stores
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [isLoadingStores, setIsLoadingStores] = useState(true);

    // Customer Cart
    const [cart, setCart] = useState({
        items: [],
        subtotal: 0,
        deliveryFee: 15,
        totalAmount: 15
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Active Order Modal for Real-time Tracking
    const [trackingOrder, setTrackingOrder] = useState(null);

    // User & Addresses
    const [user, setUser] = useState({
        user_id: 12,
        full_name: 'Aravind Swaminathan',
        email: 'aravind@gmail.com',
        phone: '+919840444441',
        role_name: 'CUSTOMER'
    });
    const [addresses, setAddresses] = useState([
        { address_id: 1, address_line: 'Flat 3B, Ceebros Heights, 12 Pondy Bazaar', area: 'T. Nagar', city: 'Chennai', pincode: '600017', is_default: 1 },
        { address_id: 2, address_line: 'Tidel Park, 4th Floor, Rajiv Gandhi Salai', area: 'Taramani', city: 'Chennai', pincode: '600113', is_default: 0 }
    ]);
    const [selectedAddressId, setSelectedAddressId] = useState(1);

    // Toast notifications
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Keep auth token and demo role synchronized with currentRole persona
    useEffect(() => {
        const roleToSync = (currentRole === 'NOTEBOOK' || currentRole === 'SALES_DB') ? 'ADMIN' : currentRole;
        localStorage.setItem('quickkart_role', roleToSync);

        async function syncRoleToken() {
            try {
                const res = await api.getDemoToken(roleToSync);
                if (res.data?.token) {
                    localStorage.setItem('quickkart_token', res.data.token);
                    if (res.data.user) {
                        setUser(prev => ({
                            ...prev,
                            user_id: res.data.user.userId,
                            full_name: res.data.user.fullName,
                            email: res.data.user.email,
                            role_name: res.data.user.roleName
                        }));
                    }
                }
            } catch (err) {
                console.warn('Could not sync demo token:', err.message);
            }
        }
        syncRoleToken();
    }, [currentRole]);

    // Load stores on mount
    useEffect(() => {
        async function loadInitialData() {
            try {
                const res = await api.getStores();
                if (res.data) {
                    const list = res.data.allStores || res.data;
                    setStores(list);
                    if (list.length > 0 && !selectedStore) {
                        setSelectedStore(list[0]);
                    }
                }
            } catch (err) {
                console.error('Failed to load stores:', err);
            } finally {
                setIsLoadingStores(false);
            }
        }
        loadInitialData();
    }, []);

    // Refresh cart when store changes
    useEffect(() => {
        if (selectedStore) {
            refreshCart(selectedStore.store_id);
        }
    }, [selectedStore]);

    const refreshCart = async (storeId) => {
        try {
            const sid = storeId || (selectedStore ? selectedStore.store_id : 1);
            const res = await api.getCart(sid);
            if (res.data) {
                setCart(res.data);
            }
        } catch (e) {
            console.error('Error fetching cart:', e);
        }
    };

    // Add item to cart
    const addToCart = async (variant, product, quantity = 1) => {
        if (!selectedStore) return;
        try {
            await api.addToCart({
                storeId: selectedStore.store_id,
                variantId: variant.variant_id,
                quantity
            });

            // Optimistic / reactive update
            setCart(prev => {
                const existingIndex = prev.items.findIndex(i => i.variant_id === variant.variant_id);
                let newItems = [...prev.items];
                if (existingIndex >= 0) {
                    newItems[existingIndex].quantity = quantity;
                    newItems[existingIndex].item_subtotal = quantity * variant.price;
                } else {
                    newItems.push({
                        variant_id: variant.variant_id,
                        product_name: product.product_name,
                        variant_name: variant.variant_name,
                        unit: variant.unit,
                        price: variant.price,
                        quantity,
                        item_subtotal: quantity * variant.price,
                        image_url: product.image_url
                    });
                }
                const subtotal = newItems.reduce((s, i) => s + (i.price * i.quantity), 0);
                const deliveryFee = subtotal >= 200 || subtotal === 0 ? 0 : 15;
                return {
                    ...prev,
                    items: newItems,
                    subtotal,
                    deliveryFee,
                    totalAmount: subtotal + deliveryFee
                };
            });

            showToast(`Added ${product.product_name} (${variant.variant_name}) to cart!`);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // Remove item from cart
    const removeFromCart = async (variantId) => {
        try {
            await api.removeFromCart(variantId);
            setCart(prev => {
                const newItems = prev.items.filter(i => i.variant_id !== variantId);
                const subtotal = newItems.reduce((s, i) => s + (i.price * i.quantity), 0);
                const deliveryFee = subtotal >= 200 || subtotal === 0 ? 0 : 15;
                return {
                    ...prev,
                    items: newItems,
                    subtotal,
                    deliveryFee,
                    totalAmount: subtotal + deliveryFee
                };
            });
            showToast('Item removed from cart.');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // Checkout Order
    const placeOrder = async (paymentMethod = 'UPI') => {
        if (!selectedStore) return;
        try {
            const res = await api.placeOrder({
                storeId: selectedStore.store_id,
                addressId: selectedAddressId,
                paymentMethod
            });

            if (res.success) {
                showToast(`Order #${res.data.orderNumber} placed successfully! Stored procedure executed.`, 'success');
                setIsCartOpen(false);
                setCart({
                    items: [],
                    subtotal: 0,
                    deliveryFee: 15,
                    totalAmount: 15
                });
                setTrackingOrder(res.data.order || { order_id: res.data.orderId, order_number: res.data.orderNumber, order_status: 'CONFIRMED' });
                return res.data;
            }
        } catch (err) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    // Cancel order
    const cancelOrder = async (orderId, reason) => {
        try {
            const res = await api.cancelOrder(orderId, reason);
            if (res.success) {
                showToast('Order cancelled. Stock released & refund recorded via sp_cancel_order.', 'warning');
                if (trackingOrder && trackingOrder.order_id === orderId) {
                    setTrackingOrder(prev => ({ ...prev, order_status: 'CANCELLED' }));
                }
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const value = {
        currentRole,
        setCurrentRole,
        stores,
        selectedStore,
        setSelectedStore,
        isLoadingStores,
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        placeOrder,
        cancelOrder,
        trackingOrder,
        setTrackingOrder,
        user,
        setUser,
        addresses,
        setAddresses,
        selectedAddressId,
        setSelectedAddressId,
        toast,
        showToast
    };

    return (
        <AppContext.Provider value={value}>
            {children}
            {/* Global Floating Toast */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                    background: toast.type === 'error' ? 'var(--danger)' : toast.type === 'warning' ? '#d9480f' : 'var(--bg-dark)',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-xl)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    animation: 'slideUp 200ms ease-out'
                }}>
                    <span>{toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : '✅'}</span>
                    <span>{toast.message}</span>
                </div>
            )}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
