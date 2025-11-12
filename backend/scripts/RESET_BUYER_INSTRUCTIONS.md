# Buyer Password Reset Instructions

## Reset Buyer on Production (Render Database)

### Option 1: Using the Script Locally (Recommended)

1. **Get your Render database URL:**
   - Go to Render Dashboard → Your Database → Connect
   - Copy the "Internal Database URL" or "External Connection String"
   - Format: `postgresql://user:password@host:port/database`

2. **Run the reset script:**
   ```powershell
   # Activate virtual environment
   cd "C:\Users\Administrator\Documents\Munda Market"
   .venv\Scripts\activate.ps1
   
   # Set database URL and run script
   cd backend
   $env:DATABASE_URL = "postgresql://katuruza:kDmctAA0cWmfBUo0DNTXMFUOD9EM4iI8@dpg-d4a8dmre5dus739vc0vg-a.singapore-postgres.render.com/munda_market_db"
   python scripts/reset_buyer.py
   ```

3. **Reset specific buyer:**
   ```powershell
   # Reset by phone number
   python scripts/reset_buyer.py +263771234567 newpassword123
   
   # Reset by email
   python scripts/reset_buyer.py buyer@mundamarket.co.zw newpassword123
   ```

4. **List all buyers:**
   ```powershell
   python scripts/reset_buyer.py --list
   ```

### Option 2: Direct SQL (Alternative)

If you have direct database access:

```sql
-- Update buyer password (replace with actual hash)
UPDATE users 
SET hashed_password = '$2b$12$...', 
    status = 'ACTIVE',
    is_verified = true
WHERE phone = '+263771234567' AND role = 'BUYER';
```

## Default Test Buyer Credentials

After running `python scripts/reset_buyer.py` without arguments:

- **Phone:** `+263771234568`
- **Email:** `buyer@mundamarket.co.zw`
- **Password:** `buyer123`
- **Status:** ACTIVE
- **Verified:** Yes

## Troubleshooting

### Connection Issues
- Ensure your IP is whitelisted in Render database settings
- Check that DATABASE_URL is correctly formatted
- Verify virtual environment has all dependencies installed

### Password Not Working
- Check user status is ACTIVE
- Verify phone/email has no leading/trailing spaces
- Ensure password hash was generated correctly

### Multiple Buyers Found
- Use `--list` to see all buyers
- Specify phone or email to target specific user
- Check for duplicate accounts

