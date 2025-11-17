# Farmer & Buyer Self-Registration Guide

## Overview

Farmers and buyers can now self-register through their respective login pages. All new registrations require admin approval before users can access the platform.

## Registration Flow

### 1. Farmer Registration

**Location**: Farmer App Login Page

**Steps**:
1. Navigate to the Farmer App login page
2. Click **"Don't have an account? Register"** button
3. Fill in registration form:
   - Full Name (required)
   - Phone Number (required) - Must start with +263 or 0
   - Email (optional)
   - Password (required) - Minimum 6 characters
   - Confirm Password (required)
4. Click **"Register"** button
5. Wait for success message: "Registration successful! Please login."
6. Account is created with **PENDING** status
7. User cannot login until approved by admin

### 2. Buyer Registration

**Location**: Buyer Portal Login Page

**Steps**:
1. Navigate to the Buyer Portal login page
2. Click **"Don't have an account? Register"** button
3. Fill in registration form:
   - Full Name (required)
   - Phone Number (required) - Must start with +263 or 0
   - Email (optional)
   - Password (required) - Minimum 6 characters
   - Confirm Password (required)
4. Click **"Register"** button
5. Success message: "Registration successful! Your account is pending approval. You will be notified once approved."
6. Account is created with **PENDING** status
7. User cannot login until approved by admin

## Admin Approval Process

### Reviewing Registrations

1. **Access KYC Queue**
   - Log in to Admin Console
   - Navigate to **KYC Queue** from sidebar

2. **View Pending Registrations**
   - All pending farmer and buyer registrations appear in the table
   - Information displayed:
     - Name
     - Phone
     - Email
     - Role (FARMER or BUYER)
     - Submission date
     - Status (PENDING)

3. **Approve or Reject**
   - Click **"Approve"** button to approve the registration
   - Click **"Reject"** button to reject the registration
   - Optionally add notes explaining the decision
   - Click **"Approve"** or **"Reject"** to confirm

4. **After Approval**
   - User status changes to **ACTIVE**
   - User can now login with their credentials
   - User receives notification (if notification system is enabled)

5. **After Rejection**
   - User status changes to **DEACTIVATED**
   - User cannot login
   - Notes explain why the registration was rejected

## Registration Validation

### Phone Number Format
- Must start with `+263` (international) or `0` (local)
- Examples:
  - ✅ `+263771234567`
  - ✅ `0771234567`
  - ❌ `771234567` (missing prefix)

### Password Requirements
- Minimum 6 characters
- No special character requirements
- Must match confirmation password

### Email
- Optional for both farmers and buyers
- Must be valid email format if provided
- Cannot be duplicate (each email must be unique)

### Phone Number
- Required for both farmers and buyers
- Cannot be duplicate (each phone must be unique)
- Used as primary login credential

## API Endpoints

### Registration Endpoint
- **URL**: `POST /api/v1/auth/register`
- **Body**:
```json
{
  "name": "John Farmer",
  "phone": "+263771234567",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "FARMER"  // or "BUYER"
}
```
- **Response**: User object with PENDING status

### KYC Review Endpoint
- **URL**: `POST /api/v1/admin/kyc/review`
- **Body**:
```json
{
  "user_id": 123,
  "approved": true,
  "notes": "Verified credentials"
}
```
- **Response**: Success message

## User Experience

### Registration Success
- **Farmer App**: Alert message → "Registration successful! Please login."
- **Buyer Portal**: Alert message → "Registration successful! Your account is pending approval. You will be notified once approved."
- Form automatically switches to login mode
- Phone number is pre-filled for convenience

### Login Attempt Before Approval
- Error message: "Incorrect username or password" (generic for security)
- User cannot access the platform until approved

### After Approval
- User can login with their phone number and password
- Full access to their respective portal (Farmer App or Buyer Portal)

## Admin Notifications

When a new registration is submitted:
- Count appears in KYC Queue badge/counter
- Admin can review immediately
- No automatic notifications (manual check required)

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt before storage
2. **Phone Validation**: Phone numbers are validated on both frontend and backend
3. **Duplicate Prevention**: System prevents duplicate phone numbers and emails
4. **Status-based Access**: Only ACTIVE users can login
5. **Admin Review**: Manual review prevents automated spam registrations

## Troubleshooting

### User Cannot Register
- **Phone already exists**: "User with this phone number or email already exists"
- **Invalid phone format**: "Phone number must start with +263 or 0"
- **Password too short**: "Password must be at least 6 characters"
- **Passwords don't match**: "Passwords do not match"

### User Cannot Login After Registration
- Check KYC Queue in Admin Console
- Verify user status is ACTIVE, not PENDING
- Confirm user is using correct phone number and password

### Admin Cannot Approve
- Check user exists in database
- Verify admin has staff permissions
- Check backend logs for errors

## Benefits

### For Users
- ✅ Self-service registration
- ✅ No need to contact sales representative
- ✅ Fast account creation
- ✅ Clear feedback on registration status

### For Admins
- ✅ Centralized approval process
- ✅ Review all registrations in one place
- ✅ Add notes for record keeping
- ✅ Prevent fraudulent registrations
- ✅ Control platform access

## Next Steps

After registration and approval:

### Farmers
1. Login to Farmer App
2. Register farms (location, size, type)
3. Create production plans
4. List crops for sale
5. Manage orders

### Buyers
1. Login to Buyer Portal
2. Complete buyer profile (optional)
3. Browse available crops
4. Place orders
5. Track deliveries
6. Manage inventory

---

**Note**: This registration system ensures quality control by requiring manual admin approval for all new accounts, preventing spam and ensuring legitimate users on the platform.
