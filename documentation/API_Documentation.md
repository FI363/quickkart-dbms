# QuickKart — Backend REST API Documentation

Base URL: `http://localhost:5000/api`  
Authentication: `Authorization: Bearer <JWT_TOKEN>`  

---

## 1. Authentication (`/api/auth`)

### 1.1 Register Customer
- **Endpoint:** `POST /api/auth/register`
- **Request Body:**
```json
{
  "fullName": "Aravind Swaminathan",
  "email": "aravind@gmail.com",
  "phone": "+919840444441",
  "password": "password123",
  "addressLine": "Flat 3B, Pondy Bazaar",
  "area": "T. Nagar",
  "pincode": "600017"
}
```
- **Response (201):**
```json
{
  "success": true,
  "message": "Customer registered successfully.",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "userId": 12,
      "fullName": "Aravind Swaminathan",
      "email": "aravind@gmail.com",
      "phone": "+919840444441",
      "roleName": "CUSTOMER"
    }
  }
}
```

### 1.2 User Login
- **Endpoint:** `POST /api/auth/login`
- **Request Body:**
```json
{
  "email": "admin@quickkart.in",
  "password": "password123"
}
```
- **Response (200):**
```json
{
  "success": true,
  "message": "Logged in successfully.",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "userId": 1,
      "fullName": "Farhaan Admin",
      "email": "admin@quickkart.in",
      "roleName": "ADMIN"
    }
  }
}
```

### 1.3 Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <TOKEN>`

---

## 2. Product Catalogue (`/api/products`)

### 2.1 Browse Products
- **Endpoint:** `GET /api/products`
- **Query Params:**
  - `storeId` *(optional)*: When supplied, stock levels are filtered for that specific dark store via `vw_available_products`.
  - `categoryId` *(optional)*: Filter by category.
  - `search` *(optional)*: Filter by title, brand, or SKU.
  - `limit`, `offset` *(optional)*: Pagination.

### 2.2 Category Tree
- **Endpoint:** `GET /api/products/categories`
- Returns root categories with nested child categories (`parent_category_id`).

### 2.3 Single Product Details
- **Endpoint:** `GET /api/products/:id?storeId=1`

---

## 3. Dark Stores (`/api/stores`)

### 3.1 List All Dark Stores
- **Endpoint:** `GET /api/stores`

### 3.2 Find Nearby Dark Store
- **Endpoint:** `GET /api/stores/nearby?lat=13.0418&lon=80.2341`
- Computes nearest hub using the Haversine formula (`fn_haversine_distance`) and verifies serviceability against `service_radius_km`.

---

## 4. Shopping Cart (`/api/cart`)

### 4.1 Get Active Cart
- **Endpoint:** `GET /api/cart?storeId=1`
- **Headers:** `Authorization: Bearer <TOKEN>`
- Computes cart subtotal dynamically via stored function `fn_calculate_cart_total`.

### 4.2 Add or Update Item in Cart
- **Endpoint:** `POST /api/cart/items`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "storeId": 1,
  "variantId": 1,
  "quantity": 2
}
```

### 4.3 Remove Item from Cart
- **Endpoint:** `DELETE /api/cart/items/:variantId`
- **Headers:** `Authorization: Bearer <TOKEN>`

---

## 5. Orders (`/api/orders`)

### 5.1 Place Order (ACID Stored Procedure)
- **Endpoint:** `POST /api/orders`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "storeId": 1,
  "addressId": 1,
  "paymentMethod": "UPI"
}
```
- **Execution:** Calls stored procedure `sp_place_order`, locking inventory with `SELECT ... FOR UPDATE`, snapshotting name and price into `order_items`, reserving stock in `store_inventory`, creating payment & delivery task, and converting the active cart.

### 5.2 List Orders
- **Endpoint:** `GET /api/orders`
- Returns customer order history (or all store orders if Store Manager/Admin).

### 5.3 Order Details
- **Endpoint:** `GET /api/orders/:id`
- Returns order header, snapshot items, tracking timeline from `order_status_history`, payment record, and assigned rider.

### 5.4 Cancel Order
- **Endpoint:** `PATCH /api/orders/:id/cancel`
- **Request Body:**
```json
{
  "reason": "Ordered wrong product size"
}
```
- **Execution:** Calls stored procedure `sp_cancel_order`, releasing reserved inventory and initiating a refund record.

---

## 6. Inventory Management (`/api/inventory`)

### 6.1 Store Inventory
- **Endpoint:** `GET /api/inventory/:storeId`

### 6.2 Low Stock Alert Report
- **Endpoint:** `GET /api/inventory/reports/low-stock?storeId=1`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: STORE_MANAGER, ADMIN)
- Reads from view `vw_low_stock`.

### 6.3 Restock Item
- **Endpoint:** `POST /api/inventory/restock`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: STORE_MANAGER, ADMIN)
- **Request Body:**
```json
{
  "storeId": 1,
  "variantId": 23,
  "quantity": 30,
  "notes": "Weekly tea replenishment"
}
```
- Calls stored procedure `sp_add_inventory`.

### 6.4 Inter-Store Stock Transfer
- **Endpoint:** `POST /api/inventory/transfer`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: STORE_MANAGER, ADMIN)
- **Request Body:**
```json
{
  "sourceStoreId": 4,
  "destinationStoreId": 1,
  "variantId": 2,
  "quantity": 15,
  "notes": "Emergency milk transfer"
}
```
- Calls stored procedure `sp_transfer_inventory`.

---

## 7. Delivery Fleet (`/api/deliveries`)

### 7.1 List Available Riders
- **Endpoint:** `GET /api/deliveries/riders`

### 7.2 Dispatch / Assign Rider
- **Endpoint:** `POST /api/deliveries/assign`
- **Request Body:**
```json
{
  "orderId": 4,
  "partnerId": 1
}
```
- Calls stored procedure `sp_assign_delivery`.

### 7.3 Update Delivery Status
- **Endpoint:** `PATCH /api/deliveries/:id/status`
- **Request Body:**
```json
{
  "status": "DELIVERED"
}
```
- Automatically triggers `trg_release_rider_on_delivered`, marking the rider back to `AVAILABLE`.

### 7.4 Fleet Performance Analytics
- **Endpoint:** `GET /api/deliveries/performance`
- Reads from view `vw_delivery_performance`.

---

## 8. Analytics (`/api/analytics`)

### 8.1 Daily Sales Report
- **Endpoint:** `GET /api/analytics/daily-sales?storeId=1`
- Reads from view `vw_daily_store_sales`.

### 8.2 Executive KPI Summary
- **Endpoint:** `GET /api/analytics/summary`
- Returns total dark stores, products, active orders, total revenue, low stock count, and active fleet count.
