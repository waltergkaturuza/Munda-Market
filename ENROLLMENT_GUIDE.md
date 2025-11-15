# Farmer and Buyer Enrollment Guide

## Overview

This guide explains how farmers and buyers get enrolled in the Munda Market platform. There are two main methods: **Admin-created accounts** and **Self-registration** (if implemented).

## Method 1: Admin Console Enrollment (Current Implementation)

### Creating Farmers

1. **Access the Admin Console**
   - Log in to the admin console with admin/staff credentials
   - Navigate to the **Farmers** page from the sidebar

2. **Click "Create Farmer" Button**
   - You'll see a blue "Create Farmer" button in the top-right corner of the Farmers page
   - Click it to open the creation form

3. **Fill in Farmer Details**
   - **Full Name** (required): The farmer's full name
   - **Phone Number** (required): Must start with `+263` or `0` (e.g., `+263771234567`)
   - **Email** (optional): Farmer's email address
   - **Password** (required): Minimum 6 characters - this will be the farmer's login password
   - **Auto-activate account**: Toggle switch
     - ✅ **ON**: Farmer can login immediately after account creation
     - ❌ **OFF**: Account will be in PENDING status and require admin approval

4. **Submit the Form**
   - Click "Create Farmer" button
   - The farmer account will be created and appear in the farmers list

5. **What Happens Next**
   - The farmer receives their login credentials (phone number + password)
   - If auto-activated, they can immediately log in to the farmer portal
   - They will need to register farms after logging in to start using the platform
   - If not auto-activated, admin must approve them from the PENDING tab

### Creating Buyers

1. **Access the Admin Console**
   - Log in to the admin console
   - Navigate to the **Buyers** page from the sidebar

2. **Click "Create Buyer" Button**
   - You'll see a blue "Create Buyer" button in the top-right corner of the Buyers page
   - Click it to open the creation form

3. **Fill in Buyer Details**
   - **Full Name** (required): The buyer's full name
   - **Phone Number** (required): Must start with `+263` or `0` (e.g., `+263771234567`)
   - **Email** (optional): Buyer's email address
   - **Password** (required): Minimum 6 characters - this will be the buyer's login password
   - **Company Name** (optional): If provided, a buyer profile will be created automatically
   - **Business Type** (optional): e.g., Restaurant, Retailer, Wholesaler
   - **Auto-activate account**: Toggle switch
     - ✅ **ON**: Buyer can login immediately after account creation
     - ❌ **OFF**: Account will be in PENDING status and require admin approval

4. **Submit the Form**
   - Click "Create Buyer" button
   - The buyer account will be created and appear in the buyers list

5. **What Happens Next**
   - The buyer receives their login credentials (phone number + password)
   - If auto-activated, they can immediately log in to the buyer portal
   - If company name was provided, a buyer profile is automatically created
   - If no company name was provided, admin can create a profile later using the "Create Profile" option in the buyer's menu

### Creating Buyer Profiles (After Account Creation)

If a buyer account was created without a company name, you can add a profile later:

1. **Find the Buyer** in the buyers list
2. **Click the three-dot menu** (⋮) next to the buyer
3. **Select "Create Profile"**
4. **Fill in Business Details**:
   - Company Name (required)
   - Business Type
   - Business Phone
   - Business Email
   - Tax Number (optional)
5. **Submit** to create the profile

## Method 2: Self-Registration (If Implemented)

Currently, the platform uses admin-created accounts. Self-registration endpoints may exist in the backend but are not exposed in the frontend portals.

If self-registration is enabled:
- Farmers would register through the farmer portal
- Buyers would register through the buyer portal
- Accounts would start in PENDING status
- Admin would need to approve them through the KYC page

## Account Statuses

### User Statuses
- **PENDING**: New account awaiting admin approval
- **ACTIVE**: Account is active and can use the platform
- **SUSPENDED**: Account temporarily disabled (admin can reactivate)
- **DEACTIVATED**: Account permanently disabled

### Verification Status
- **Verified**: User has been verified by admin
- **Unverified**: User has not been verified yet

## Admin Actions Available

### For Farmers:
- ✅ View farmer details (farms, production, earnings)
- ✅ Suspend/Activate accounts
- ✅ Create new farmer accounts
- ✅ View production plans and farms

### For Buyers:
- ✅ View buyer details (orders, spending, company info)
- ✅ Suspend/Activate accounts
- ✅ Create new buyer accounts
- ✅ Create buyer profiles
- ✅ View purchase history

## Workflow Summary

### Typical Enrollment Flow:

1. **Admin creates account** → Account created with chosen status
2. **Credentials shared** → Admin shares phone number and password with user
3. **User logs in** → User accesses their respective portal (farmer/buyer)
4. **Profile completion**:
   - **Farmers**: Must register farms to start production
   - **Buyers**: May need buyer profile created (if not done during account creation)
5. **Platform usage** → User can now use the platform features

## Troubleshooting

### "I don't see the Create buttons"
- Ensure you're logged in as an admin or staff user
- Check that you're on the correct page (Farmers or Buyers)
- Refresh the page if buttons don't appear

### "User already exists" error
- The phone number or email is already registered
- Check existing users before creating duplicates
- Use the search/filter features to find existing accounts

### "Account created but user can't login"
- Check if account is auto-activated
- If not, approve the account from the PENDING tab
- Verify the phone number format is correct
- Ensure password meets minimum requirements (6+ characters)

## API Endpoints

The backend provides these endpoints for admin use:

- `POST /api/v1/admin/farmers/create` - Create farmer account
- `POST /api/v1/admin/buyers/create` - Create buyer account
- `POST /api/v1/admin/buyers/{buyer_id}/create-profile` - Create buyer profile
- `GET /api/v1/admin/farmers` - List all farmers
- `GET /api/v1/admin/buyers` - List all buyers

## Best Practices

1. **Always verify phone numbers** before creating accounts
2. **Use strong passwords** or set temporary passwords that users must change
3. **Enable auto-activate** only for trusted users
4. **Create buyer profiles** during account creation if company information is available
5. **Document credentials** securely when sharing with users
6. **Monitor PENDING accounts** regularly and approve/reject promptly

## Next Steps After Enrollment

### For Farmers:
1. Log in to farmer portal
2. Register farms (location, size, type)
3. Create production plans
4. List crops for sale

### For Buyers:
1. Log in to buyer portal
2. Complete buyer profile (if not done by admin)
3. Browse available crops
4. Place orders

---

**Note**: This guide reflects the current implementation. Features may be added or modified in future updates.

