# Current Setup (Without Custom Domains)

## Backend
- **URL:** `https://munda-market.onrender.com`
- **Status:** ✅ Working (confirmed via health check)
- **CORS:** Configured to allow requests from Vercel frontends

## Frontend Applications

### Admin Console
- **URL:** `https://munda-market-admin.vercel.app`
- **Backend API:** `https://munda-market.onrender.com`
- **Status:** Configured ✅

### Buyer Portal
- **URL:** `https://munda-market-buyer.vercel.app`
- **Backend API:** `https://munda-market.onrender.com`
- **Status:** Needs redeployment ⚠️

## Configuration Summary

### Backend CORS (`backend/app/main.py`)
```python
allowed_origins = [
    "https://munda-market-admin.vercel.app",  # Admin Console
    "https://munda-market-buyer.vercel.app",  # Buyer Portal
    # ... localhost for development
]
```

### Buyer Portal API Configuration (`buyer-portal/src/services/auth.js`)
- Automatically detects Vercel deployment
- Falls back to `https://munda-market.onrender.com` when on Vercel
- Uses `http://localhost:8000` for local development

### Vercel Configuration (`buyer-portal/vercel.json`)
```json
{
  "env": {
    "REACT_APP_API_BASE_URL": "https://munda-market.onrender.com"
  }
}
```

## Next Steps

### 1. Redeploy Buyer Portal on Vercel
The buyer portal needs to be redeployed to pick up the latest changes:

**Option A: Automatic (if connected to GitHub)**
- Push changes to GitHub (already done ✅)
- Vercel will automatically redeploy

**Option B: Manual**
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select `munda-market-buyer` project
3. Go to **Deployments** tab
4. Click **Redeploy** on the latest deployment

### 2. Set Environment Variable in Vercel (Recommended)
Even though `vercel.json` has the env var, it's better to set it in the dashboard:

1. Go to Vercel Dashboard → Buyer Portal Project
2. **Settings** → **Environment Variables**
3. Add:
   - **Name:** `REACT_APP_API_BASE_URL`
   - **Value:** `https://munda-market.onrender.com`
   - **Environment:** Production, Preview, Development
4. Click **Save**
5. **Redeploy** the application

### 3. Test Login
After redeployment, test with:
- **Phone:** `+263771234568`
- **Email:** `buyer@mundamarket.co.zw`
- **Password:** `buyer123`

## Debugging

### Check API URL Being Used
Add `?debug=api` to the buyer portal URL:
```
https://munda-market-buyer.vercel.app/?debug=api
```
This will log the API configuration to the browser console.

### Verify Backend is Accessible
- Health check: https://munda-market.onrender.com/health
- API docs: https://munda-market.onrender.com/docs

### Common Issues

1. **CORS Error:**
   - Ensure backend has redeployed with latest CORS changes
   - Check that `https://munda-market-buyer.vercel.app` is in allowed origins

2. **404 Errors:**
   - Verify buyer portal is using correct API URL
   - Check browser console for actual URL being called

3. **401 Unauthorized:**
   - Verify buyer credentials are correct
   - Check backend logs for authentication errors

## Future: Custom Domains

When you're ready to set up custom domains:

1. **Backend:** `api.mundamarket.co.zw` → `munda-market.onrender.com`
2. **Admin Console:** `admin.mundamarket.co.zw` → Vercel deployment
3. **Buyer Portal:** `buy.mundamarket.co.zw` → Vercel deployment

Update environment variables and CORS configuration accordingly.

