/**
 * QuickKart: Quick-Commerce Management System
 * API Service Client with Local Fallback Resilience
 */

const API_BASE = 'http://localhost:5000/api';

// Helper for authorization header
function getHeaders() {
    const token = localStorage.getItem('quickkart_token');
    const role = localStorage.getItem('quickkart_role') || 'ADMIN';
    return {
        'Content-Type': 'application/json',
        'x-demo-role': role,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...getHeaders(),
                ...(options.headers || {})
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `HTTP error ${response.status}`);
        }
        return data;
    } catch (err) {
        // If it's a network failure (server offline), use local mock fallback
        if (err.name === 'TypeError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            console.warn(`[API FAILOVER] API request to ${endpoint} failed (${err.message}). Using local fallback mock state.`);
            return getMockFallback(endpoint, options);
        }
        // Surface actual server errors so they are not masked as fake successes
        throw err;
    }
}

// ----------------------------------------------------------------------------
// Local In-Memory Fallback State (Ensures 100% functionality even before DB start)
// ----------------------------------------------------------------------------
const MOCK_STORES = [
    { store_id: 1, store_name: 'QuickKart T. Nagar Hub', area: 'T. Nagar', city: 'Chennai', pincode: '600017', latitude: 13.0418, longitude: 80.2341, service_radius_km: 4.5 },
    { store_id: 2, store_name: 'QuickKart Adyar Hub', area: 'Adyar', city: 'Chennai', pincode: '600020', latitude: 13.0012, longitude: 80.2565, service_radius_km: 5.0 },
    { store_id: 3, store_name: 'QuickKart Velachery Hub', area: 'Velachery', city: 'Chennai', pincode: '600042', latitude: 12.9815, longitude: 80.2180, service_radius_km: 5.0 },
    { store_id: 4, store_name: 'QuickKart Anna Nagar Hub', area: 'Anna Nagar', city: 'Chennai', pincode: '600040', latitude: 13.0850, longitude: 80.2101, service_radius_km: 4.0 }
];

const MOCK_CATEGORIES = [
    { category_id: 1, category_name: 'Dairy & Breakfast', slug: 'dairy-breakfast', subcategories: [
        { category_id: 6, category_name: 'Milk & Cream' },
        { category_id: 7, category_name: 'Curd & Paneer' },
        { category_id: 8, category_name: 'Bread & Eggs' }
    ]},
    { category_id: 2, category_name: 'Fruits & Vegetables', slug: 'fruits-vegetables', subcategories: [
        { category_id: 9, category_name: 'Fresh Vegetables' },
        { category_id: 10, category_name: 'Fresh Fruits' }
    ]},
    { category_id: 3, category_name: 'Snacks & Munchies', slug: 'snacks-munchies', subcategories: [
        { category_id: 11, category_name: 'Chips & Crisps' },
        { category_id: 12, category_name: 'Biscuits & Cookies' }
    ]},
    { category_id: 4, category_name: 'Beverages', slug: 'beverages', subcategories: [
        { category_id: 13, category_name: 'Cold Drinks & Sodas' },
        { category_id: 14, category_name: 'Tea & Coffee' }
    ]}
];

let MOCK_PRODUCTS = [
    { product_id: 1, product_name: 'Amul Taaza Toned Milk', brand_name: 'Amul', category_name: 'Dairy & Breakfast', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80', variants: [
        { variant_id: 1, sku: 'AML-MLK-500', variant_name: '500 ml Pouch', unit: '500 ml', price: 27.00, mrp: 28.00, available_quantity: 45 },
        { variant_id: 2, sku: 'AML-MLK-1000', variant_name: '1 Litre Tetra Pak', unit: '1 L', price: 74.00, mrp: 78.00, available_quantity: 20 }
    ]},
    { product_id: 2, product_name: 'Aavin Green Magic Toned Milk', brand_name: 'Aavin', category_name: 'Dairy & Breakfast', image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80', variants: [
        { variant_id: 3, sku: 'AAV-MLK-500', variant_name: '500 ml Fresh Pouch', unit: '500 ml', price: 22.00, mrp: 22.00, available_quantity: 60 }
    ]},
    { product_id: 3, product_name: 'Amul Fresh Malai Paneer', brand_name: 'Amul', category_name: 'Dairy & Breakfast', image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80', variants: [
        { variant_id: 4, sku: 'AML-PAN-200', variant_name: '200g Block', unit: '200 g', price: 92.00, mrp: 95.00, available_quantity: 12 },
        { variant_id: 5, sku: 'AML-PAN-500', variant_name: '500g Block', unit: '500 g', price: 215.00, mrp: 225.00, available_quantity: 8 }
    ]},
    { product_id: 4, product_name: 'Britannia 100% Whole Wheat Bread', brand_name: 'Britannia', category_name: 'Dairy & Breakfast', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80', variants: [
        { variant_id: 7, sku: 'BRT-BRD-400', variant_name: '400g Sliced Loaf', unit: '400 g', price: 45.00, mrp: 50.00, available_quantity: 35 }
    ]},
    { product_id: 5, product_name: 'Farm Fresh White Protein Eggs', brand_name: 'Farm Fresh', category_name: 'Dairy & Breakfast', image_url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=400&q=80', variants: [
        { variant_id: 8, sku: 'FF-EGG-6PK', variant_name: 'Pack of 6', unit: '6 pcs', price: 42.00, mrp: 48.00, available_quantity: 25 },
        { variant_id: 9, sku: 'FF-EGG-12PK', variant_name: 'Pack of 12', unit: '12 pcs', price: 80.00, mrp: 95.00, available_quantity: 15 }
    ]},
    { product_id: 6, product_name: 'Fresh Farm Red Tomatoes', brand_name: 'Farm Fresh', category_name: 'Fruits & Vegetables', image_url: 'https://images.unsplash.com/photo-1546470427-227c7369a94d?auto=format&fit=crop&w=400&q=80', variants: [
        { variant_id: 10, sku: 'VEG-TOM-500', variant_name: '500g', unit: '500 g', price: 18.00, mrp: 22.00, available_quantity: 40 },
        { variant_id: 11, sku: 'VEG-TOM-1000', variant_name: '1 kg', unit: '1 kg', price: 34.00, mrp: 40.00, available_quantity: 30 }
    ]},
    { product_id: 7, product_name: 'Fresh Red Onions', brand_name: 'Farm Fresh', category_name: 'Fruits & Vegetables', image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80', variants: [
        { variant_id: 13, sku: 'VEG-ONI-1000', variant_name: '1 kg Net Bag', unit: '1 kg', price: 42.00, mrp: 48.00, available_quantity: 50 }
    ]},
    { product_id: 8, product_name: 'Lay\'s Classic Salted Potato Chips', brand_name: 'Lay\'s', category_name: 'Snacks & Munchies', image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80', variants: [
        { variant_id: 16, sku: 'LYS-SLT-50', variant_name: '50g Pouch', unit: '50 g', price: 20.00, mrp: 20.00, available_quantity: 80 },
        { variant_id: 17, sku: 'LYS-SLT-90', variant_name: '90g Party Pack', unit: '90 g', price: 40.00, mrp: 40.00, available_quantity: 45 }
    ]},
    { product_id: 9, product_name: 'Tata Tea Premium Blend', brand_name: 'Tata', category_name: 'Beverages', image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80', variants: [
        { variant_id: 23, sku: 'TAT-TEA-500', variant_name: '500g Pack', unit: '500 g', price: 260.00, mrp: 280.00, available_quantity: 6 } // Low stock demo!
    ]},
    { product_id: 10, product_name: 'Coca-Cola Zero Sugar', brand_name: 'Coca-Cola', category_name: 'Beverages', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', variants: [
        { variant_id: 22, sku: 'COC-ZRO-750', variant_name: '750 ml Bottle', unit: '750 ml', price: 45.00, mrp: 45.00, available_quantity: 35 }
    ]}
];

let MOCK_CART = {
    cartId: 1,
    storeId: 1,
    items: [
        { variant_id: 1, product_name: 'Amul Taaza Toned Milk', variant_name: '500 ml Pouch', unit: '500 ml', price: 27.00, quantity: 2, item_subtotal: 54.00, image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
        { variant_id: 7, product_name: 'Britannia 100% Whole Wheat Bread', variant_name: '400g Sliced Loaf', unit: '400 g', price: 45.00, quantity: 1, item_subtotal: 45.00, image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' }
    ],
    subtotal: 99.00,
    deliveryFee: 15.00,
    totalAmount: 114.00
};

let MOCK_ORDERS = [
    {
        order_id: 1,
        order_number: 'ORD-20260202-841920',
        order_date: '2026-02-02 08:30:00',
        fulfillment_hub: 'QuickKart T. Nagar Hub',
        delivery_address_snapshot: 'Flat 3B, Ceebros Heights, 12 Pondy Bazaar, T. Nagar, Chennai - 600017',
        total_item_units: 3,
        subtotal: 99.00,
        delivery_fee: 15.00,
        discount: 0.00,
        total_amount: 114.00,
        order_status: 'OUT_FOR_DELIVERY',
        payment_status: 'SUCCESS',
        payment_method: 'UPI',
        delivery_status: 'PICKED_UP',
        delivery_partner_name: 'Murugan Selvam',
        partner_vehicle: 'EV_SCOOTER',
        items: [
            { product_name_snapshot: 'Amul Taaza Toned Milk', variant_name_snapshot: '500 ml Pouch', quantity: 2, unit_price: 27.00, subtotal: 54.00 },
            { product_name_snapshot: 'Britannia 100% Whole Wheat Bread', variant_name_snapshot: '400g Sliced Loaf', quantity: 1, unit_price: 45.00, subtotal: 45.00 }
        ]
    }
];

function getMockFallback(endpoint, options) {
    if (endpoint.startsWith('/stores/nearby') || endpoint === '/stores') {
        return { success: true, data: { nearestStore: MOCK_STORES[0], isServiced: true, allStores: MOCK_STORES } };
    }
    if (endpoint.startsWith('/products/categories')) {
        return { success: true, data: MOCK_CATEGORIES };
    }
    if (endpoint.startsWith('/products')) {
        return { success: true, data: MOCK_PRODUCTS };
    }
    if (endpoint.startsWith('/cart')) {
        return { success: true, data: MOCK_CART };
    }
    if (endpoint.startsWith('/orders') && options.method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        const newOrder = {
            order_id: Date.now(),
            order_number: `ORD-20260202-${Math.floor(Math.random() * 900000 + 100000)}`,
            order_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
            fulfillment_hub: 'QuickKart T. Nagar Hub',
            delivery_address_snapshot: 'Flat 3B, Pondy Bazaar, T. Nagar, Chennai - 600017',
            total_item_units: MOCK_CART.items.reduce((s, i) => s + i.quantity, 0),
            subtotal: MOCK_CART.subtotal,
            delivery_fee: MOCK_CART.deliveryFee,
            discount: 0,
            total_amount: MOCK_CART.totalAmount,
            order_status: 'CONFIRMED',
            payment_status: 'SUCCESS',
            payment_method: body.paymentMethod || 'UPI',
            delivery_status: 'ASSIGNED',
            delivery_partner_name: 'Murugan Selvam',
            partner_vehicle: 'EV_SCOOTER',
            items: MOCK_CART.items.map(i => ({
                product_name_snapshot: i.product_name,
                variant_name_snapshot: i.variant_name,
                quantity: i.quantity,
                unit_price: i.price,
                subtotal: i.item_subtotal
            }))
        };
        MOCK_ORDERS.unshift(newOrder);
        MOCK_CART.items = [];
        MOCK_CART.subtotal = 0;
        MOCK_CART.totalAmount = 0;
        return { success: true, message: 'Order placed successfully (ACID Transaction Simulated)', data: { orderId: newOrder.order_id, orderNumber: newOrder.order_number, order: newOrder } };
    }
    if (endpoint.startsWith('/orders')) {
        return { success: true, data: MOCK_ORDERS };
    }
    if (endpoint.includes('/low-stock')) {
        return {
            success: true,
            data: [
                { inventory_id: 15, store_name: 'QuickKart T. Nagar Hub', store_area: 'T. Nagar', product_name: 'Tata Tea Premium Blend', variant_name: '500g Pack', unit: '500 g', total_quantity: 6, reorder_level: 15, recommended_reorder_qty: 39, alert_severity: 'LOW_STOCK' },
                { inventory_id: 18, store_name: 'QuickKart Adyar Hub', store_area: 'Adyar', product_name: 'Amul Malai Paneer', variant_name: '200g Block', unit: '200 g', total_quantity: 4, reorder_level: 10, recommended_reorder_qty: 26, alert_severity: 'LOW_STOCK' }
            ]
        };
    }
    if (endpoint.includes('/daily-sales')) {
        return {
            success: true,
            data: [
                { sale_date: '2026-02-02', store_name: 'QuickKart T. Nagar Hub', total_orders: 28, delivered_orders: 25, gross_merchandise_value: 8450.00, net_settled_revenue: 8120.00, average_order_value: 324.80 },
                { sale_date: '2026-02-02', store_name: 'QuickKart Adyar Hub', total_orders: 22, delivered_orders: 20, gross_merchandise_value: 6720.00, net_settled_revenue: 6450.00, average_order_value: 322.50 }
            ]
        };
    }
    if (endpoint.includes('/summary')) {
        return {
            success: true,
            data: {
                total_dark_stores: 4,
                total_products: 19,
                total_skus: 24,
                total_customers: 8,
                available_riders: 4,
                total_orders: 6,
                delivered_orders: 2,
                active_orders: 3,
                total_revenue: 352.00,
                low_stock_alerts: 2
            }
        };
    }
    if (endpoint.includes('/performance')) {
        return {
            success: true,
            data: [
                { partner_id: 1, partner_name: 'Murugan Selvam', vehicle_type: 'EV_SCOOTER', rating: 4.90, completed_deliveries: 18, avg_delivery_minutes: 14.2, completion_percentage: 94.7 },
                { partner_id: 2, partner_name: 'Senthil Kumar', vehicle_type: 'BIKE', rating: 4.85, completed_deliveries: 15, avg_delivery_minutes: 16.5, completion_percentage: 93.3 }
            ]
        };
    }
    if (endpoint.startsWith('/analytics/sold-products')) {
        const mockSold = [
            { order_item_id: 1, product_name: 'Amul Taaza Homogenised Toned Milk', variant_name: '500 ml Pouch', quantity: 2, unit_price: 27, total_amount: 54, order_number: 'ORD-2026-0005', sale_date: new Date().toISOString(), order_status: 'CONFIRMED', store_name: 'QuickKart T. Nagar Hub', customer_name: 'Aravind Swaminathan' },
            { order_item_id: 2, product_name: 'Britannia Whole Wheat Bread', variant_name: '400g Loaf', quantity: 1, unit_price: 45, total_amount: 45, order_number: 'ORD-2026-0005', sale_date: new Date().toISOString(), order_status: 'CONFIRMED', store_name: 'QuickKart T. Nagar Hub', customer_name: 'Aravind Swaminathan' },
            { order_item_id: 3, product_name: 'Tata Tea Premium Blend', variant_name: '500g Pack', quantity: 1, unit_price: 260, total_amount: 260, order_number: 'ORD-2026-0004', sale_date: new Date().toISOString(), order_status: 'OUT_FOR_DELIVERY', store_name: 'QuickKart Anna Nagar Hub', customer_name: 'Keerthana Ravichandran' }
        ];
        return {
            success: true,
            count: mockSold.length,
            summary: { totalSoldQuantity: 4, totalRevenue: 359, distinctProductsCount: 3 },
            topProducts: mockSold.map(m => ({ product_name: m.product_name, units_sold: m.quantity, total_amount: m.total_amount })),
            data: mockSold
        };
    }
    if (endpoint.startsWith('/auth/me')) {
        return {
            success: true,
            data: {
                user: { user_id: 12, full_name: 'Aravind Swaminathan', email: 'aravind@gmail.com', phone: '+919840444441', role_name: 'CUSTOMER' },
                addresses: [
                    { address_id: 1, address_line: 'Flat 3B, Ceebros Heights, 12 Pondy Bazaar', area: 'T. Nagar', city: 'Chennai', pincode: '600017', is_default: 1 }
                ]
            }
        };
    }

    return { success: true, message: 'Simulated operation success' };
}

export const api = {
    // Auth
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getDemoToken: (role) => request(`/auth/demo-token${role ? `/${role}` : ''}`),
    getMe: () => request('/auth/me'),

    // Stores
    getStores: () => request('/stores'),
    getNearbyStore: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/stores/nearby?${query}`);
    },

    // Products & Categories
    getCategories: () => request('/products/categories'),
    getProducts: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/products?${query}`);
    },
    getProductById: (id, storeId) => request(`/products/${id}${storeId ? `?storeId=${storeId}` : ''}`),

    // Cart
    getCart: (storeId) => request(`/cart${storeId ? `?storeId=${storeId}` : ''}`),
    addToCart: (item) => request('/cart/items', { method: 'POST', body: JSON.stringify(item) }),
    removeFromCart: (variantId) => request(`/cart/items/${variantId}`, { method: 'DELETE' }),
    clearCart: () => request('/cart', { method: 'DELETE' }),

    // Orders
    placeOrder: (orderData) => request('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
    getOrders: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/orders?${query}`);
    },
    getOrderById: (id) => request(`/orders/${id}`),
    cancelOrder: (id, reason) => request(`/orders/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

    // Inventory
    getStoreInventory: (storeId) => request(`/inventory/${storeId}`),
    getLowStock: (storeId) => request(`/inventory/reports/low-stock${storeId ? `?storeId=${storeId}` : ''}`),
    restockItem: (data) => request('/inventory/restock', { method: 'POST', body: JSON.stringify(data) }),
    transferStock: (data) => request('/inventory/transfer', { method: 'POST', body: JSON.stringify(data) }),
    getTransactions: (storeId) => request(`/inventory/reports/transactions${storeId ? `?storeId=${storeId}` : ''}`),

    // Deliveries
    getAvailableRiders: () => request('/deliveries/riders'),
    assignDelivery: (data) => request('/deliveries/assign', { method: 'POST', body: JSON.stringify(data) }),
    updateDeliveryStatus: (id, status) => request(`/deliveries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    getDeliveryPerformance: () => request('/deliveries/performance'),

    // Analytics & Sales DB
    getDailySales: (storeId) => request(`/analytics/daily-sales${storeId ? `?storeId=${storeId}` : ''}`),
    getSummary: () => request('/analytics/summary'),
    getSoldProducts: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/analytics/sold-products${query ? `?${query}` : ''}`);
    },
    getDbaRecords: () => request('/analytics/dba-records')
};
