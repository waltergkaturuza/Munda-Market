# Vercel Environment Variables Setup for Buyer Portal

## Issue
The buyer portal is trying to connect to `https://api.mundamarket.co.zw` but this domain may not be configured yet, causing CORS errors.

## Solution

### Option 1: Set Environment Variable in Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your **buyer-portal** project
3. Go to **Settings** → **Environment Variables**
4. Add the following:

   **Name:** `REACT_APP_API_BASE_URL`  
   **Value:** `https://munda-market.onrender.com`  
   **Environment:** Production, Preview, Development (select all)

5. Click **Save**
6. **Redeploy** the application:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **Redeploy**

### Option 2: Use Custom Domain (When DNS is Configured)

Once you've set up the DNS CNAME record for `api.mundamarket.co.zw`:

1. Update the environment variable in Vercel:
   **Name:** `REACT_APP_API_BASE_URL`  
   **Value:** `https://api.mundamarket.co.zw`

2. Redeploy the application

## Verify Configuration

After setting the environment variable and redeploying:

1. Open the buyer portal in your browser
2. Open browser DevTools → Console
3. Check the network requests - they should go to:
   - `https://munda-market.onrender.com/api/v1/...` (if using Render URL)
   - `https://api.mundamarket.co.zw/api/v1/...` (if using custom domain)

## Current Configuration

- **vercel.json** has: `REACT_APP_API_BASE_URL: https://munda-market.onrender.com`
- But Vercel may require environment variables to be set in the dashboard for them to work properly

## Troubleshooting

If you still see CORS errors:

1. **Check backend CORS configuration** - Ensure `https://munda-market-buyer.vercel.app` is in allowed origins
2. **Verify backend is running** - Check `https://munda-market.onrender.com/health`
3. **Check DNS** - If using custom domain, verify DNS is configured correctly
4. **Clear browser cache** - Hard refresh (Ctrl+Shift+R) to clear cached JavaScript

