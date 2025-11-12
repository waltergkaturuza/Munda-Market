# Buyer Inventory Management System - Feature Documentation

## Overview

A comprehensive inventory management system for buyers (hotels, supermarkets, wholesalers, restaurants) that helps manage perishable stock efficiently through real-time tracking, automated alerts, shelf-life management, and sales intensity insights.

## Core Features

### 1. Stock Dashboard

**Purpose:** Provides buyers with a clear overview of their inventory health.

**Key Metrics:**
- Total Stock Value (USD)
- Total Items (number of different products)
- Low Stock Items (count)
- Expiring Soon Items (count)
- Expired Items (count)
- Total Quantity (kg)
- Average Days of Stock Cover

**Endpoint:** `GET /api/v1/buyer-inventory/dashboard/metrics`

**Visual:** Dashboard cards showing key metrics at a glance.

---

### 2. Stock Items Management

**Purpose:** Track current inventory levels for each product.

**Features:**
- Current quantity (kg)
- Reserved quantity (kg)
- Available quantity (kg)
- Reorder point (kg)
- Safety stock (kg)
- Days of stock cover
- Stock status (safe, low, critical, reorder)
- Expiry date and days until expiry
- Expiry status (fresh, approaching, expired)
- Unit cost and total value
- Sales intensity code (A/B/C/D)
- Inventory turnover ratio
- Days of inventory

**Endpoint:** `GET /api/v1/buyer-inventory/stock`

**Stock Status Logic:**
- **Safe:** Stock above reorder point × 1.2
- **Low:** Stock between reorder point and reorder point × 1.2
- **Reorder:** Stock at or below reorder point
- **Critical:** Stock at or below safety stock

**Expiry Status Logic:**
- **Fresh:** 4+ days remaining
- **Approaching:** 2-3 days remaining
- **Expired:** Past expiry date

---

### 3. Reorder Point & Auto Alerts

**Purpose:** Automate replenishment decisions using the ROP formula.

**Formula:**
```
Reorder Point (ROP) = (Average Daily Usage × Lead Time) + Safety Stock
```

**Calculation:**
- Average Daily Usage: Calculated from consumption history (last 30 days)
- Lead Time: Days from order to delivery (default: 3 days, configurable)
- Safety Stock: Buffer stock (default: 2 days of usage, configurable)

**Endpoint:** `POST /api/v1/buyer-inventory/stock/calculate-reorder-point?crop_id={id}`

**Auto Alerts:**
- When stock ≤ ROP → Alert generated
- Severity based on days until stockout:
  - Critical: < 1 day
  - High: 1-3 days
  - Medium: 3-5 days

**Reorder Suggestions:**
- Endpoint: `GET /api/v1/buyer-inventory/stock/reorder-suggestions`
- Shows items that need reordering
- Suggests reorder quantity based on minimum stock cover days
- Displays urgency level (critical, high, medium)

---

### 4. Shelf-Life Tracking

**Purpose:** Manage perishables intelligently with expiry date tracking.

**Features:**
- Purchase date tracking
- Shelf-life days (from crop.perishability_days or manual input)
- Expiry date calculation: `purchase_date + shelf_life_days`
- Days until expiry countdown
- Color-coded expiry status:
  - 🟢 Fresh (4+ days)
  - 🟡 Approaching (2-3 days)
  - 🔴 Expired (past expiry)

**Auto-Sync:**
- When orders are delivered, stock is automatically added
- Expiry date calculated from crop's `perishability_days`
- Stock movements recorded automatically

**Manual Tracking:**
- Buyers can manually record stock movements
- Can specify custom shelf-life days
- Can mark items as expired/waste

---

### 5. Minimum Stock Cover / Buffer

**Purpose:** Ensure continuous availability.

**Features:**
- Buyers can set "Minimum Stock Cover" = number of days they must always have supply for
- System monitors usage and projects future needs
- Example: "You consume 50 kg onions/day. Your current stock (200 kg) covers 4 days. Minimum cover: 7 days → Suggest reorder 150 kg."

**Calculation:**
```
Target Stock = Average Daily Usage × Minimum Stock Cover Days
Suggested Reorder = Target Stock - Current Stock
```

---

### 6. Turnover & Stock Movement Analysis

**Purpose:** Identify slow, fast, and obsolete products (Sales Intensity Codes).

**Formulas:**

**Inventory Turnover:**
```
Inventory Turnover = Cost of Goods Sold / Average Inventory
```

**Days of Inventory:**
```
Days of Inventory = 365 / Inventory Turnover
```

**Sales Intensity Classification:**

| Code | Description | Movement Type | Days to Sellout |
|------|-------------|---------------|-----------------|
| A | Fast moving | < 3 days | Priority reorder |
| B | Normal moving | 4-7 days | Maintain regular orders |
| C | Slow moving | > 7 days | Review ordering frequency |
| D | Obsolete | Unsold/expired | Consider promotions |

**Endpoint:** `GET /api/v1/buyer-inventory/stock/sales-intensity?days=30`

**Recommendations:**
- **A items:** Fast moving - prioritize reorder
- **B items:** Normal moving - maintain regular orders
- **C items:** Slow moving - review ordering frequency
- **D items:** Obsolete - consider promotions or reduce order quantity

---

### 7. Sales Intensity Dashboard

**Purpose:** Visualize consumption trends and demand patterns.

**Features:**
- Consumption trends per week
- Per category analysis
- Demand forecast based on seasonality
- Historical sales data
- Export reports (future: PDF/Excel)

**Metrics Displayed:**
- Inventory Turnover
- Days of Inventory
- Average Daily Consumption
- Days to Sellout
- Sales Intensity Code
- Recommendations

---

### 8. Stock Movements History

**Purpose:** Track all stock transactions.

**Movement Types:**
- **Purchase:** Stock received from order
- **Consumption:** Stock used/sold
- **Waste:** Stock expired/damaged
- **Adjustment:** Manual adjustment
- **Return:** Returned to supplier

**Endpoint:** `GET /api/v1/buyer-inventory/stock/movements`

**Features:**
- Filter by crop, movement type, date range
- Shows quantity, cost, total value
- Notes and metadata
- Links to source orders

**Recording Movements:**
- Endpoint: `POST /api/v1/buyer-inventory/stock/movements`
- Buyers can manually record:
  - Purchases (with cost)
  - Consumption (usage)
  - Waste (expired/damaged)
  - Adjustments

---

### 9. Integration with Orders

**Purpose:** Automatic stock sync when orders are delivered.

**Auto-Sync Logic:**
- When order status changes to `DELIVERED`
- Stock automatically added to buyer inventory
- Purchase movement recorded
- Expiry date calculated from crop's `perishability_days`
- Stock value calculated from order item prices

**Service:** `backend/app/services/stock_sync.py`

**Functions:**
- `sync_stock_from_order()` - Sync stock when order delivered
- `record_consumption()` - Record stock usage
- `record_waste()` - Record expired/damaged stock

---

## Database Models

### BuyerStock
- Tracks current stock levels per buyer per crop
- Stores reorder points, safety stock, lead times
- Tracks expiry dates and shelf-life
- Stores sales intensity codes and turnover metrics

### StockMovement
- Historical record of all stock transactions
- Links to orders, crops, buyers
- Tracks quantities, costs, dates
- Supports multiple movement types

---

## API Endpoints Summary

### Dashboard & Metrics
- `GET /buyer-inventory/dashboard/metrics` - Get dashboard metrics
- `GET /buyer-inventory/stock` - Get all stock items
- `GET /buyer-inventory/stock/reorder-suggestions` - Get reorder suggestions

### Stock Movements
- `POST /buyer-inventory/stock/movements` - Record stock movement
- `GET /buyer-inventory/stock/movements` - Get movement history

### Calculations
- `POST /buyer-inventory/stock/calculate-reorder-point` - Calculate ROP
- `GET /buyer-inventory/stock/sales-intensity` - Get sales intensity analysis

---

## Frontend Components

### InventoryMonitoring Page
- **Stock Dashboard Tab:** Table view of all stock items with status and expiry
- **Reorder Suggestions Tab:** Cards showing items that need reordering
- **Sales Intensity Tab:** Table with turnover analysis and recommendations
- **Movements History Tab:** Table of all stock transactions

### Features:
- Real-time metrics dashboard
- Status filtering (safe, low, critical, reorder)
- Color-coded status chips
- Expiry countdown display
- One-click reorder buttons
- Movement recording dialog

---

## Future Enhancements

1. **QR/Barcode Scanning:** Link with device camera to scan receipts
2. **Demand Forecasting:** AI-powered demand prediction based on historical data
3. **Seasonality Analysis:** Adjust forecasts based on seasonal patterns
4. **Export Reports:** PDF/Excel export for inventory reports
5. **Integration with Munda Market Data:** Feed buyer usage data back to improve farmer planting forecasts
6. **Mobile App:** Native mobile app for inventory management
7. **Batch Tracking:** Track specific batches/lots with expiry dates
8. **Multi-location Support:** Manage inventory across multiple warehouses/locations

---

## Usage Examples

### Recording Stock Purchase
```javascript
await buyerInventoryApi.createStockMovement({
  crop_id: 1,
  movement_type: 'purchase',
  quantity_kg: 100,
  unit_cost_usd: 2.50,
  notes: 'Received from order #12345'
});
```

### Calculating Reorder Point
```javascript
const rop = await buyerInventoryApi.calculateReorderPoint(1, 3, 2);
// Returns: { calculated_reorder_point_kg: 150, average_daily_usage_kg: 30, ... }
```

### Getting Reorder Suggestions
```javascript
const suggestions = await buyerInventoryApi.getReorderSuggestions();
// Returns: [{ crop_name: 'Tomatoes', suggested_reorder_kg: 150, urgency: 'critical', ... }]
```

---

## Benefits

1. **Reduced Waste:** Shelf-life tracking prevents expired stock
2. **Optimized Inventory:** ROP calculations ensure optimal stock levels
3. **Demand Predictability:** Sales intensity analysis helps forecast demand
4. **Cost Savings:** Avoid stockouts and overstocking
5. **Data-Driven Decisions:** Turnover metrics guide purchasing decisions
6. **Automation:** Auto-sync with orders reduces manual data entry
7. **Sustainability:** Better inventory management reduces food waste

---

## Technical Notes

- Stock is automatically synced when orders are delivered
- Reorder points are calculated from consumption history (last 30 days)
- Sales intensity codes are updated based on days to sellout
- Expiry dates are calculated from crop's `perishability_days` field
- All calculations are performed server-side for accuracy
- Frontend refreshes data every 60 seconds for real-time updates

