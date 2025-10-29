# Munda Market Backend

The backend API for the Munda Market two-sided marketplace platform.

## Quick Start

### Prerequisites

1. Python 3.8+
2. PostgreSQL 12+
3. Virtual environment (recommended)

### Installation

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On Unix/MacOS
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up database**:
   ```bash
   # Create PostgreSQL database
   createdb munda_market
   
   # Copy environment file
   copy env.example .env
   # Edit .env with your database credentials
   ```

5. **Initialize database**:
   ```bash
   python init_db.py
   ```

6. **Test the application**:
   ```bash
   python test_app.py
   ```

7. **Start the server**:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

## API Documentation

Once running, visit:
- **Interactive docs**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

## Default Credentials

- **Admin**: 
  - Phone: +263771234567
  - Password: admin123

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Current user info

### Farmers
- `POST /api/v1/farmers/` - Create farmer profile
- `GET /api/v1/farmers/` - List farmers
- `POST /api/v1/farmers/farms` - Register farm
- `POST /api/v1/farmers/production-plans` - Create production plan
- `POST /api/v1/farmers/lots` - Create lot

### Crops
- `GET /api/v1/crops/` - List available crops
- `GET /api/v1/crops/{crop_id}` - Get crop details

### Other Endpoints
- Buyers, Orders, Payments, QC, Admin (coming soon)

## Database Schema

The system includes comprehensive models for:
- Users (farmers, buyers, admin, ops)
- Farms with geospatial data
- Crops and grade schemas
- Production plans and lots
- Orders and order items
- Payments and payouts
- Shipments and logistics
- Quality control checks
- Audit logs

## Development

### Adding New Endpoints

1. Create endpoint file in `app/api/v1/endpoints/`
2. Add router to `app/api/v1/__init__.py`
3. Test with `python test_app.py`

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests (when test files are created)
pytest
```

## Configuration

Key environment variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost/munda_market

# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# APIs (optional for MVP)
WHATSAPP_ACCESS_TOKEN=your-token
STRIPE_SECRET_KEY=your-key
```

## Project Structure

```
backend/
├── app/
│   ├── core/           # Configuration and auth
│   ├── models/         # Database models
│   ├── api/            # API endpoints
│   ├── services/       # Business logic
│   └── utils/          # Utilities and helpers
├── alembic/            # Database migrations
├── tests/              # Test files
└── init_db.py          # Database setup script
```

## Next Steps

1. **Frontend Development**: Build React buyer portal and Flutter farmer app
2. **Payment Integration**: Add ZIPIT, EcoCash, RTGS support
3. **WhatsApp Integration**: Implement farmer photo uploads
4. **Deployment**: Set up production environment
5. **Testing**: Add comprehensive test suite

## Troubleshooting

### Common Issues

1. **Database connection error**: Check PostgreSQL is running and credentials are correct
2. **Import errors**: Ensure virtual environment is activated
3. **Permission errors**: Make sure user has database creation permissions

### Getting Help

- Check logs in console output
- Verify environment variables in `.env`
- Test imports with `python test_app.py`
- Check API documentation at `/docs`
