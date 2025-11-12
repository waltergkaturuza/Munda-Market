# 🚀 Munda Market - Deployment Checklist

## Pre-Deployment Preparation

### ✅ Code & Configuration
- [ ] All code committed to GitHub
- [ ] `.env` files not committed (in .gitignore)
- [ ] Production environment variables documented
- [ ] API endpoints tested locally
- [ ] Database migrations ready
- [ ] Remove all `console.log` statements
- [ ] Update version numbers

### ✅ Domain & DNS
- [ ] Domain purchased (e.g., mundamarket.co.zw)
- [ ] DNS access configured
- [ ] Subdomain plan ready:
  - [ ] `api.mundamarket.co.zw` → Backend
  - [ ] `admin.mundamarket.co.zw` → Admin Console
  - [ ] `buy.mundamarket.co.zw` → Buyer Portal

### ✅ Accounts Setup
- [ ] Render.com account created
- [ ] Vercel account created
- [ ] Google Play Console account ($25)
- [ ] GitHub repository ready

### ✅ Third-Party Services
- [ ] Stripe account (if using)
- [ ] EcoCash API access
- [ ] ZIPIT API access
- [ ] WhatsApp Business API
- [ ] Twilio account (SMS)

---

## 1. Backend Deployment (Render.com)

### Create PostgreSQL Database
- [ ] Create PostgreSQL database on Render
- [ ] Name: `munda-market-db`
- [ ] Plan: Starter ($7/month minimum)
- [ ] Region: Oregon or Singapore
- [ ] Copy Internal Database URL

### Create Web Service
- [ ] Connect GitHub repository
- [ ] Select `backend` folder
- [ ] Environment: Python 3
- [ ] Region: Same as database
- [ ] Plan: Starter ($7/month minimum)

### Configure Build
- [ ] Build Command: `pip install -r requirements-core.txt && pip install pydantic-settings "bcrypt<4.0"`
- [ ] Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Health Check Path: `/health`

### Environment Variables
- [ ] `DATABASE_URL` - from PostgreSQL service
- [ ] `SECRET_KEY` - auto-generate (keep secret!)
- [ ] `DEBUG=false`
- [ ] `ALLOWED_HOSTS` - your domains
- [ ] `ALGORITHM=HS256`
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES=30`
- [ ] Payment gateway keys (optional)
- [ ] Messaging API keys (optional)

### Post-Deployment
- [ ] Wait for deployment to complete (~5 min)
- [ ] Check logs for errors
- [ ] Visit `/health` endpoint
- [ ] Visit `/docs` to verify API
- [ ] Run database initialization:
  ```bash
  # In Render Shell
  python init_db.py
  python scripts/reset_admin.py
  ```
- [ ] Test login with admin credentials
- [ ] Add custom domain (optional)

---

## 2. Admin Console Deployment (Vercel)

### Import Project
- [ ] Go to vercel.com → New Project
- [ ] Import from GitHub
- [ ] Select repository
- [ ] Root Directory: `admin-console`

### Configure Project
- [ ] Framework: Vite
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

### Environment Variables
- [ ] `VITE_API_BASE_URL=https://api.mundamarket.co.zw` (or your Render URL)

### Deploy
- [ ] Click "Deploy"
- [ ] Wait for deployment (~2 min)
- [ ] Test the preview URL
- [ ] Verify login works
- [ ] Check all pages load

### Custom Domain (Optional)
- [ ] Add domain: `admin.mundamarket.co.zw`
- [ ] Update DNS:
  ```
  Type: CNAME
  Name: admin
  Value: cname.vercel-dns.com
  ```
- [ ] Wait for SSL certificate (~5 min)
- [ ] Test HTTPS connection

---

## 3. Buyer Portal Deployment (Vercel)

### Import Project
- [ ] New Project on Vercel
- [ ] Same repository
- [ ] Root Directory: `buyer-portal`

### Configure Project
- [ ] Framework: Create React App
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `build`
- [ ] Install Command: `npm install`

### Environment Variables
- [ ] `REACT_APP_API_URL=https://api.mundamarket.co.zw`

### Deploy
- [ ] Click "Deploy"
- [ ] Test preview URL
- [ ] Verify all functionality

### Custom Domain (Optional)
- [ ] Add domain: `buy.mundamarket.co.zw` or `market.mundamarket.co.zw`
- [ ] Update DNS (CNAME)
- [ ] Test HTTPS

---

## 4. Flutter App Deployment (Google Play)

### Prepare App
- [ ] Update `pubspec.yaml` version (e.g., 1.0.0+1)
- [ ] Update API URL in app code to production
- [ ] Create app icons (all required sizes)
- [ ] Create splash screen
- [ ] Test thoroughly on real devices

### Create Signing Key
```bash
keytool -genkey -v -keystore munda-market.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias munda
```
- [ ] Store keystore file securely
- [ ] Document passwords securely
- [ ] Never commit keystore to Git

### Build Release
```bash
# App Bundle for Play Store
flutter build appbundle --release

# APK for direct download
flutter build apk --release
```
- [ ] Test signed APK on device
- [ ] Verify all features work

### Google Play Console Setup
- [ ] Create app in Play Console
- [ ] Fill in store listing:
  - [ ] App name: "Munda Market - Farmer"
  - [ ] Short description (80 chars)
  - [ ] Full description (4000 chars)
  - [ ] App icon (512x512)
  - [ ] Feature graphic (1024x500)
  - [ ] Screenshots (at least 2)
  - [ ] Privacy policy URL
  - [ ] Category: Business or Productivity
  - [ ] Content rating questionnaire
  - [ ] Target audience
  - [ ] Contact details

### Upload & Submit
- [ ] Upload AAB file
- [ ] Select countries (Zimbabwe, etc.)
- [ ] Set pricing (Free)
- [ ] Submit for review
- [ ] Wait for approval (1-7 days typically)

### Post-Approval
- [ ] Publish to production
- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Plan update schedule

---

## 5. Post-Deployment Verification

### Backend (Render)
- [ ] Health check: `https://api.mundamarket.co.zw/health`
- [ ] API docs: `https://api.mundamarket.co.zw/docs` (if DEBUG=true)
- [ ] Test login endpoint
- [ ] Test dashboard stats endpoint
- [ ] Check database connection
- [ ] Monitor logs for errors
- [ ] Verify CORS working

### Admin Console (Vercel)
- [ ] Visit: `https://admin.mundamarket.co.zw`
- [ ] Test login: `+263771234567` / `admin123`
- [ ] Navigate all pages
- [ ] Test dark mode toggle
- [ ] Test CRUD operations
- [ ] Verify mobile responsiveness
- [ ] Check console for errors

### Buyer Portal (Vercel)
- [ ] Visit: `https://buy.mundamarket.co.zw`
- [ ] Test browsing crops
- [ ] Test cart functionality
- [ ] Test checkout (if implemented)
- [ ] Verify mobile experience

### Flutter App
- [ ] Install on test device
- [ ] Test login
- [ ] Test all farmer features
- [ ] Test offline behavior
- [ ] Verify notifications work
- [ ] Check permissions

---

## 6. Monitoring Setup

### Set Up Monitoring
- [ ] **Uptime Robot** (free):
  - [ ] Monitor backend (`/health`)
  - [ ] Monitor admin console
  - [ ] Monitor buyer portal
  - [ ] Email alerts on downtime

- [ ] **Sentry** (optional, $26/month):
  - [ ] Backend error tracking
  - [ ] Frontend error tracking
  - [ ] Mobile crash reporting

- [ ] **Render Logs**:
  - [ ] Check daily for errors
  - [ ] Set up log retention

### Analytics (Optional)
- [ ] Google Analytics (frontend)
- [ ] Mixpanel (user behavior)
- [ ] Firebase Analytics (Flutter)

---

## 7. Security Hardening

### Backend
- [ ] Rotate `SECRET_KEY` after initial deploy
- [ ] Enable rate limiting (future)
- [ ] Set up IP blocking for abuse (if needed)
- [ ] Regular dependency updates
- [ ] Database backup verification

### Frontend
- [ ] Enable security headers (CSP, X-Frame-Options)
- [ ] Regular dependency updates
- [ ] XSS protection verified

### Mobile
- [ ] Enable ProGuard (code obfuscation)
- [ ] SSL certificate pinning (optional)
- [ ] Regular security updates

---

## 8. Backup & Disaster Recovery

### Database Backups
- [ ] Render automatic backups enabled (daily)
- [ ] Test restore process
- [ ] Download manual backup monthly

### Code Backups
- [ ] Git repository is primary backup
- [ ] Multiple team members have access
- [ ] Tag releases: `git tag v1.0.0`

### Configuration Backups
- [ ] Document all environment variables
- [ ] Keep deployment configs in Git
- [ ] Secure storage for secrets (1Password, etc.)

---

## 🎉 Deployment Complete Checklist

Once everything is deployed:

- [ ] ✅ Backend API responding
- [ ] ✅ Database initialized with seed data
- [ ] ✅ Admin console accessible
- [ ] ✅ Buyer portal accessible
- [ ] ✅ Flutter app on Play Store (or APK available)
- [ ] ✅ All integrations tested
- [ ] ✅ Monitoring alerts configured
- [ ] ✅ Team trained on admin console
- [ ] ✅ Support email/phone ready
- [ ] ✅ Launch announcement prepared

### Launch Communication
- [ ] Email existing farmers/buyers
- [ ] Social media announcement
- [ ] Press release (if applicable)
- [ ] WhatsApp broadcast
- [ ] SMS campaign

---

## 📱 Quick Reference URLs

### Development
```
Backend:       http://localhost:8000
Admin Console: http://localhost:3001
Buyer Portal:  http://localhost:3000
```

### Production
```
Backend:       https://api.mundamarket.co.zw
Admin Console: https://admin.mundamarket.co.zw
Buyer Portal:  https://buy.mundamarket.co.zw
Mobile App:    https://play.google.com/store/apps/details?id=zw.co.mundamarket.farmer
```

---

## 🆘 Troubleshooting

### Backend won't start:
1. Check Render logs
2. Verify DATABASE_URL is set
3. Ensure all dependencies installed
4. Check Python version (3.11+)

### Frontend shows API errors:
1. Verify `VITE_API_BASE_URL` or `REACT_APP_API_URL`
2. Check CORS configuration in backend
3. Ensure backend is running
4. Check browser console for errors

### Flutter app can't connect:
1. Verify API URL in code
2. Check internet permissions in AndroidManifest.xml
3. Ensure using HTTPS in production
4. Test on real device, not just emulator

---

**Status: READY FOR PRODUCTION DEPLOYMENT! 🎉**

