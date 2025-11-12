# Buyer and Farmer Registration Guide

## Overview

The Munda Market system has a two-step registration process:
1. **User Registration** - Creates a User account (buyer or farmer role)
2. **Profile Creation** - Creates Buyer or Farm profiles (required for full functionality)

## Registration Flow

### Step 1: User Registration

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+263771234567",
  "email": "john@example.com",
  "password": "password123",
  "role": "BUYER"  // or "FARMER"
}
```

**Response:**
- Creates a User record with status `PENDING`
- User can login but has limited functionality until profile is created

### Step 2: Profile Creation

#### For Buyers

**Option A: Self-Registration (Buyer Portal)**
- Endpoint: `POST /api/v1/buyers/profile`
- Requires: Buyer authentication (logged in as buyer)
- Buyer creates their own profile after registration

**Option B: Admin Creation (Admin Console)**
- Endpoint: `POST /api/v1/admin/buyers/{buyer_id}/create-profile`
- Requires: Admin authentication
- Admin creates buyer profile on behalf of buyer

**Request Body:**
```json
{
  "company_name": "ABC Trading Company",
  "business_type": "Retailer",
  "business_phone": "+263771234567",
  "business_email": "info@abctrading.co.zw",
  "tax_number": "TAX123456",
  "vat_number": "VAT123456",
  "business_registration_number": "REG123456"
}
```

#### For Farmers

**Farm Registration:**
- Endpoint: `POST /api/v1/farmers/farms`
- Requires: Farmer authentication (logged in as farmer)
- Farmer creates their own farms

**Request Body:**
```json
{
  "name": "Green Valley Farm",
  "geohash": "kf8xyz",
  "latitude": -17.8252,
  "longitude": 31.0335,
  "ward": "Ward 5",
  "district": "Harare",
  "province": "Harare",
  "address_line1": "123 Farm Road",
  "total_hectares": 10.5,
  "farm_type": "commercial",
  "irrigation_available": "drip"
}
```

## Admin Console Management

### Viewing Buyers and Farmers

**Buyers:**
- Navigate to **Buyers** page in Admin Console
- Shows all buyers with:
  - Name, Phone, Email
  - Company Name (if profile exists)
  - Total Orders, Total Spent
  - Status (ACTIVE, PENDING, SUSPENDED)
  - Verification Status

**Farmers:**
- Navigate to **Farmers** page in Admin Console
- Shows all farmers with:
  - Name, Phone, Email
  - Farms Count
  - Total Production (kg)
  - Total Earnings (USD)
  - Status (ACTIVE, PENDING, SUSPENDED)
  - Verification Status

### Creating Buyer Profiles (Admin)

1. Go to **Buyers** page
2. Find buyer without company name (no profile)
3. Click **⋮** menu → **Create Profile**
4. Fill in company details:
   - Company Name (required)
   - Business Type
   - Business Phone/Email
   - Tax/VAT numbers (optional)
5. Click **Create Profile**

### Viewing Farmer Farms (Admin)

1. Go to **Farmers** page
2. Click **View** on a farmer
3. See all farms registered by that farmer:
   - Farm Name
   - Location (District, Province)
   - Area (hectares)
   - Verification Status

## API Endpoints Summary

### Authentication
- `POST /api/v1/auth/register` - Register new user (buyer or farmer)
- `POST /api/v1/auth/login` - Login user

### Buyer Endpoints
- `POST /api/v1/buyers/profile` - Create buyer profile (self-service)
- `GET /api/v1/buyers/profile` - Get buyer profile
- `GET /api/v1/buyers/dashboard/stats` - Get buyer dashboard stats
- `GET /api/v1/buyers/orders/recent` - Get recent orders

### Farmer Endpoints
- `POST /api/v1/farmers/farms` - Create farm
- `GET /api/v1/farmers/farms` - List farms (farmer-specific)
- `POST /api/v1/farmers/production-plans` - Create production plan
- `GET /api/v1/farmers/production-plans` - List production plans (farmer-specific)
- `POST /api/v1/farmers/lots` - Create lot
- `GET /api/v1/farmers/lots` - List lots (farmer-specific)
- `GET /api/v1/farmers/dashboard/stats` - Get farmer dashboard stats

### Admin Endpoints
- `GET /api/v1/admin/buyers` - List all buyers
- `GET /api/v1/admin/buyers/{buyer_id}` - Get buyer details
- `POST /api/v1/admin/buyers/{buyer_id}/create-profile` - Create buyer profile (admin)
- `POST /api/v1/admin/buyers/{buyer_id}/suspend` - Suspend buyer
- `POST /api/v1/admin/buyers/{buyer_id}/activate` - Activate buyer
- `GET /api/v1/admin/farmers` - List all farmers
- `GET /api/v1/admin/farmers/{farmer_id}` - Get farmer details
- `GET /api/v1/admin/farmers/{farmer_id}/farms` - Get farmer farms
- `POST /api/v1/admin/farmers/{farmer_id}/suspend` - Suspend farmer
- `POST /api/v1/admin/farmers/{farmer_id}/activate` - Activate farmer

## Important Notes

1. **User Registration** creates a User record but NOT a Buyer/Farm profile
2. **Buyer Profile** must be created separately (either by buyer or admin)
3. **Farms** are created by farmers themselves after registration
4. **Admin Console** shows all users, but profiles may not exist yet
5. **Dashboard stats** require profiles to exist (buyer profile for buyers, farms for farmers)

## Workflow Examples

### Complete Buyer Registration
1. Buyer registers via `/auth/register` with role `BUYER`
2. Buyer logs in via `/auth/login`
3. Buyer creates profile via `/buyers/profile` OR
4. Admin creates profile via `/admin/buyers/{id}/create-profile`
5. Buyer can now see dashboard stats and place orders

### Complete Farmer Registration
1. Farmer registers via `/auth/register` with role `FARMER`
2. Farmer logs in via `/auth/login`
3. Farmer creates farm via `/farmers/farms`
4. Farmer creates production plans via `/farmers/production-plans`
5. Farmer can now see dashboard stats and create lots

## Troubleshooting

**Issue:** Buyer dashboard shows "Buyer profile not found"
- **Solution:** Create buyer profile via `/buyers/profile` or admin console

**Issue:** Farmer dashboard shows 0 farms
- **Solution:** Farmer needs to create farms via `/farmers/farms`

**Issue:** Admin console shows buyers but no company names
- **Solution:** Those buyers don't have profiles yet. Use "Create Profile" button.

**Issue:** Admin console shows farmers but no farms
- **Solution:** Those farmers haven't registered farms yet. Farms are created by farmers themselves.

