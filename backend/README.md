# StoreMyBottle Backend

Backend API for StoreMyBottle - A bottle storage and redemption service for bars and lounges.

## Features

- 🔐 **Authentication**: Google OAuth + Phone/OTP
- 🏢 **Venue Management**: Browse venues and available bottles
- 🛒 **Purchase Flow**: Buy bottles with QR-based payment
- 🍾 **Bottle Storage**: Track purchased bottles and remaining volume
- 📱 **QR Redemption**: Generate time-limited QR codes for peg redemptions
- 👤 **User Profiles**: Track spending and redemption history

## Tech Stack

- **Framework**: FastAPI
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: JWT tokens, Google OAuth, Twilio SMS
- **Validation**: Pydantic
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Python 3.11+
- MySQL 8.0+
- (Optional) Docker & Docker Compose

### Local Development

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE storemybottle;
   exit;
   
   # Initialize tables and seed data
   python init_db.py
   ```

6. **Run the server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

7. **Access API documentation**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Docker Development

1. **Start all services**
   ```bash
   docker-compose up --build
   ```

2. **Initialize database**
   ```bash
   docker-compose exec backend python init_db.py
   ```

3. **Access services**
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:5173
   - MySQL: localhost:3306

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/phone/send-otp` - Send OTP to phone
- `POST /api/auth/phone/verify-otp` - Verify OTP and login
- `GET /api/auth/me` - Get current user

### Venues
- `GET /api/venues` - List all venues
- `GET /api/venues/{venue_id}` - Get venue details
- `GET /api/venues/{venue_id}/bottles` - Get bottles at venue

### Purchases
- `POST /api/purchases` - Create purchase
- `POST /api/purchases/{purchase_id}/confirm` - Confirm payment
- `GET /api/purchases/my-bottles` - Get user's bottles
- `GET /api/purchases/{purchase_id}` - Get purchase details

### Redemptions
- `POST /api/redemptions/generate-qr` - Generate redemption QR
- `POST /api/redemptions/validate` - Validate and redeem QR
- `GET /api/redemptions/history` - Get redemption history

### Profile
- `GET /api/profile` - Get user profile with stats
- `PUT /api/profile` - Update user profile

## Database Schema

### Tables
- **users** - User accounts (email/phone/Google)
- **venues** - Bar/lounge locations
- **bottles** - Bottle catalog per venue
- **purchases** - User's purchased bottles
- **redemptions** - Peg redemption records
- **otps** - Phone verification OTPs

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/storemybottle

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend
FRONTEND_URL=http://localhost:5173

# Environment
ENVIRONMENT=development
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

## Development Notes

### OTP in Development
In development mode, OTPs are printed to console instead of being sent via SMS:
```
[DEV] OTP for +919876543210: 123456
```

### Test User
A test user is created during database initialization:
- Email: test@storemybottle.com
- Phone: +919876543210

### QR Code Security
- Redemption QR codes expire after 5 minutes
- One-time use only
- Venue-specific validation

## Deployment

### Production Checklist

1. ✅ Change `JWT_SECRET_KEY` to a strong random value
2. ✅ Set `ENVIRONMENT=production`
3. ✅ Configure real Twilio credentials
4. ✅ Set up Google OAuth credentials
5. ✅ Use a managed MySQL database
6. ✅ Set up SSL/TLS certificates
7. ✅ Configure proper CORS origins
8. ✅ Set up logging and monitoring

### Docker Production

```bash
# Build production image
docker build -t storemybottle-backend:latest .

# Run with production env
docker run -p 8000:8000 --env-file .env.production storemybottle-backend:latest
```

## Project Structure

```
backend/
├── routers/           # API route handlers
│   ├── auth.py       # Authentication endpoints
│   ├── venues.py     # Venue endpoints
│   ├── purchases.py  # Purchase endpoints
│   ├── redemptions.py # Redemption endpoints
│   └── profile.py    # Profile endpoints
├── main.py           # FastAPI application
├── models.py         # SQLAlchemy models
├── schemas.py        # Pydantic schemas
├── database.py       # Database connection
├── auth.py           # Authentication utilities
├── config.py         # Configuration
├── init_db.py        # Database initialization
├── requirements.txt  # Python dependencies
├── Dockerfile        # Docker configuration
└── .env.example      # Environment template
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
