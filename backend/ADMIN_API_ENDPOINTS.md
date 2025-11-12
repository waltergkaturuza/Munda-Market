# Admin API Endpoints Documentation

## Overview
Complete set of admin API endpoints for the Munda Market Admin Console.

## Authentication
All admin endpoints require:
- Valid JWT token in `Authorization: Bearer <token>` header
- User role: `ADMIN` or `OPS`

## Endpoints

### 1. Dashboard Statistics
**GET** `/api/v1/dashboard/stats`

Returns comprehensive dashboard KPIs.

**Response:**
```json
{
  "total_farmers": 150,
  "active_farmers": 120,
  "total_buyers": 80,
  "active_buyers": 65,
  "total_orders": 450,
  "orders_pending": 12,
  "orders_in_transit": 8,
  "orders_delivered_today": 25,
  "total_revenue_usd": 125000.00,
  "revenue_this_month_usd": 15000.00,
  "pending_payouts_usd": 5000.00,
  "pending_kyc_count": 5
}
```

### 2. KYC Management

#### Get Pending KYC Submissions
**GET** `/api/v1/admin/kyc/pending`

Returns list of pending KYC submissions.

**Response:**
```json
[
  {
    "user_id": 1,
    "name": "John Farmer",
    "phone": "+263771234567",
    "email": "john@example.com",
    "role": "FARMER",
    "status": "PENDING",
    "verification_documents": null,
    "created_at": "2025-01-01T10:00:00",
    "is_verified": false
  }
]
```

#### Review KYC Submission
**POST** `/api/v1/admin/kyc/review`

Approve or reject a KYC submission.

**Request:**
```json
{
  "user_id": 1,
  "approved": true,
  "notes": "All documents verified"
}
```

**Response:**
```json
{
  "message": "KYC review completed successfully"
}
```

### 3. Inventory Management

#### Get Available Inventory
**GET** `/api/v1/admin/inventory/available`

Returns inventory across all farms.

**Response:**
```json
[
  {
    "crop_id": 1,
    "crop_name": "Tomatoes",
    "available_quantity_kg": 5000.0,
    "farms_growing": 15,
    "avg_harvest_days": 90,
    "base_price_usd_per_kg": 1.50
  }
]
```

### 4. Pricing Rules

#### Get All Pricing Rules
**GET** `/api/v1/admin/pricing/rules`

Returns all pricing rules.

**Response:**
```json
[
  {
    "rule_id": 1,
    "crop_id": 1,
    "crop_name": "Tomatoes",
    "min_quantity_kg": 100.0,
    "max_quantity_kg": 500.0,
    "markup_percentage": 15.0,
    "priority": 1,
    "active": true
  }
]
```

#### Create Pricing Rule
**POST** `/api/v1/admin/pricing/rules`

Create a new pricing rule.

**Request:**
```json
{
  "crop_id": 1,
  "min_quantity_kg": 100.0,
  "max_quantity_kg": 500.0,
  "markup_percentage": 15.0,
  "priority": 1,
  "active": true
}
```

#### Delete Pricing Rule
**DELETE** `/api/v1/admin/pricing/rules/{rule_id}`

Delete a pricing rule.

**Response:**
```json
{
  "message": "Pricing rule deleted successfully"
}
```

### 5. Orders Management

#### List All Orders
**GET** `/api/v1/orders`

Returns list of orders (filtered by user role).

**Query Parameters:**
- `status` (optional): Filter by order status
- `limit` (optional): Max results (default: 100, max: 1000)

**Response:**
```json
[
  {
    "order_id": 1,
    "buyer_user_id": 5,
    "buyer_name": "Jane Buyer",
    "crop_id": 1,
    "crop_name": "Tomatoes",
    "quantity_kg": 250.0,
    "unit_price_usd": 1.75,
    "total_amount_usd": 437.50,
    "status": "PENDING",
    "delivery_date": "2025-01-15T00:00:00",
    "created_at": "2025-01-10T14:30:00"
  }
]
```

#### Update Order Status
**PATCH** `/api/v1/orders/{order_id}/status`

Update order status (admin/ops only).

**Request Body:**
```json
{
  "status": "IN_TRANSIT"
}
```

**Valid Statuses:**
- `PENDING`
- `ALLOCATED`
- `IN_TRANSIT`
- `DELIVERED`
- `CANCELLED`

### 6. Payouts Management

#### Get Pending Payouts
**GET** `/api/v1/admin/payouts/pending`

Returns pending payouts.

**Response:**
```json
[
  {
    "payout_id": 1,
    "farmer_user_id": 3,
    "farmer_name": "John Farmer",
    "amount_usd": 1500.00,
    "currency": "USD",
    "status": "PENDING",
    "payment_method": "BANK_TRANSFER",
    "transaction_reference": null,
    "created_at": "2025-01-10T10:00:00",
    "processed_at": null
  }
]
```

#### Get All Payouts
**GET** `/api/v1/admin/payouts`

Returns all payouts (recent first).

**Query Parameters:**
- `limit` (optional): Max results (default: 100, max: 1000)

#### Process Payout
**POST** `/api/v1/admin/payouts/{payout_id}/process`

Mark a payout as processed.

**Request:**
```json
{
  "transaction_reference": "TXN-123456"
}
```

**Response:**
```json
{
  "message": "Payout processed successfully"
}
```

### 7. Messaging

#### Get Message History
**GET** `/api/v1/admin/messages`

Returns message history.

**Query Parameters:**
- `limit` (optional): Max results (default: 100, max: 1000)

**Response:**
```json
[
  {
    "message_id": 1,
    "recipient_user_id": 5,
    "recipient_name": "John Farmer",
    "recipient_phone": "+263771234567",
    "channel": "SMS",
    "message_body": "Your order has been delivered",
    "status": "DELIVERED",
    "sent_at": "2025-01-10T14:00:00",
    "delivered_at": "2025-01-10T14:01:00"
  }
]
```

#### Send Message
**POST** `/api/v1/admin/messages/send`

Send message to users.

**Request:**
```json
{
  "recipient_user_ids": [1, 2, 3],
  "channel": "SMS",
  "message_body": "Important update: Market closed tomorrow"
}
```

**Channels:**
- `SMS`
- `WHATSAPP`
- `EMAIL`

**Response:**
```json
{
  "message": "Messages sent successfully",
  "count": 3
}
```

### 8. Audit Logs

#### Get Audit Logs
**GET** `/api/v1/admin/audit-logs`

Returns audit logs with optional filters.

**Query Parameters:**
- `user_id` (optional): Filter by user ID
- `action` (optional): Filter by action (partial match)
- `entity_type` (optional): Filter by entity type
- `limit` (optional): Max results (default: 100, max: 1000)

**Response:**
```json
[
  {
    "log_id": 1,
    "user_id": 1,
    "user_name": "Admin User",
    "action": "KYC_REVIEW",
    "entity_type": "USER",
    "entity_id": 5,
    "ip_address": "127.0.0.1",
    "created_at": "2025-01-10T14:30:00"
  }
]
```

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Access denied. Required roles: ['ADMIN', 'OPS']"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "user_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Testing the Endpoints

### Using cURL

```bash
# Login first
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "+263771234567", "password": "admin123"}'

# Save the token
TOKEN="your_token_here"

# Get dashboard stats
curl http://localhost:8000/api/v1/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"

# Get pending KYC
curl http://localhost:8000/api/v1/admin/kyc/pending \
  -H "Authorization: Bearer $TOKEN"

# List orders
curl http://localhost:8000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN"
```

### Using Python

```python
import requests

# Login
response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"username": "+263771234567", "password": "admin123"}
)
token = response.json()["access_token"]

# Get dashboard stats
headers = {"Authorization": f"Bearer {token}"}
stats = requests.get(
    "http://localhost:8000/api/v1/dashboard/stats",
    headers=headers
).json()

print(stats)
```

## Rate Limiting
Currently no rate limiting is enforced. In production, implement rate limiting per endpoint:
- Dashboard stats: 60 requests/minute
- List endpoints: 30 requests/minute
- Write operations: 10 requests/minute

## Pagination
For endpoints returning lists, implement cursor-based pagination for large datasets:
- Add `cursor` query parameter
- Return `next_cursor` in response
- Limit max page size to 1000 items

## Caching
Recommended caching strategies:
- Dashboard stats: Cache for 30 seconds
- Inventory: Cache for 1 minute
- Pricing rules: Cache for 5 minutes
- Orders: No caching (real-time)

## Security Notes
1. All endpoints require authentication
2. RBAC enforced at endpoint level
3. All write operations are logged to audit_log
4. Sensitive data (passwords, tokens) never returned in responses
5. SQL injection protected by SQLAlchemy ORM
6. CORS configured for admin console domain only

## Future Enhancements
1. Bulk operations (approve multiple KYC at once)
2. Advanced filtering (date ranges, multiple statuses)
3. Export functionality (CSV, PDF reports)
4. Real-time notifications via WebSocket
5. Batch messaging with templates
6. Advanced analytics endpoints
7. Scheduled reports
8. API versioning support

