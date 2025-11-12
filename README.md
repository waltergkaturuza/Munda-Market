# Munda Market

A two-sided digital marketplace platform connecting farmers and buyers through a brokered system for fresh produce trading in Zimbabwe.

## System Overview

**Munda Market** enables:
- **Farmers**: Register production plans, update crop readiness, receive payments
- **Buyers**: Discover inventory, negotiate within guardrails, place orders, track delivery
- **Admin/Broker**: Control pricing, allocations, payments, and logistics

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL + PostGIS
- **Farmer App**: Flutter (Android)
- **Buyer Portal**: React (Web)
- **Admin Console**: React (Web)
- **Messaging**: WhatsApp API + SMS
- **Payments**: ZIPIT, EcoCash, RTGS, Visa/Mastercard

## Project Structure

```
munda-market/
├── backend/                 # FastAPI backend
├── farmer-app/             # Flutter mobile app
├── buyer-portal/           # React web app for buyers
├── admin-console/          # React web app for admin
├── shared/                 # Shared utilities and types
└── docs/                  # Documentation
```

## Quick Start

1. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn main:app --reload
   ```

2. **Database Setup**:
   ```bash
   # Create PostgreSQL database
   createdb munda_market
   
   # Run migrations
   cd backend
   alembic upgrade head
   ```

3. **Frontend Setup**:
   ```bash
   # Buyer Portal
   cd buyer-portal
   npm install
   npm start
   
   # Admin Console
   cd admin-console
   npm install
   npm start
   ```

## Core Features (MVP)

- ✅ Farmer registration and KYC
- ✅ Production plan management
- ✅ Buyer discovery and search
- ✅ Order management with escrow
- ✅ Quality control and proof of delivery
- ✅ Pricing rules and markup engine
- ✅ WhatsApp integration for farmers
- ✅ Multi-currency and payment support

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## Environment Variables

Copy `.env.example` to `.env` and configure:
- Database connection
- WhatsApp API credentials
- Payment gateway keys
- JWT secret

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed production deployment instructions.

### Production Architecture:
- **Backend**: Render.com (FastAPI + PostgreSQL)
- **Admin Console**: Vercel (React/Vite)
- **Buyer Portal**: Vercel (React)
- **Farmer App**: Google Play Store (Flutter)

### Quick Deploy:
```bash
# Backend → Render.com (auto-deploy from GitHub)
# Admin Console → vercel --prod (from admin-console/)
# Buyer Portal → vercel --prod (from buyer-portal/)
# Flutter App → flutter build appbundle --release
```

## License

Proprietary - All rights reserved
