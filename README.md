# StoreMyBottle - Premium Bottle Storage Platform

A complete SaaS platform for managing bottle storage at nightlife venues. Customers can purchase and store bottles, bartenders can manage redemptions, and admins can oversee the entire operation.

## 🚀 Features

### Customer Portal
- Browse venues and available bottles
- Purchase bottles with secure payment
- Store bottles at venues
- Redeem drinks via QR code
- Track bottle inventory and history
- Password reset functionality

### Bartender Portal
- Scan customer QR codes
- Validate and process redemptions
- Manage bottle requests
- View venue statistics
- Track redemption history
- Real-time updates

### Admin Portal
- Complete venue management
- Bottle inventory control
- User management
- Purchase and redemption tracking
- Analytics and reporting
- Promotion management
- Support ticket system
- Audit logs

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MySQL
- **Authentication:** JWT with refresh tokens
- **Email:** Resend
- **QR Codes:** qrcode library

### Frontend
- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Admin), Custom (Customer/Bartender)
- **Animations:** Framer Motion
- **Notifications:** Sonner (Toast)

## 📦 Project Structure

```
StoreMyBottle/
├── backend/              # FastAPI backend
│   ├── routers/         # API endpoints
│   ├── models.py        # Database models
│   ├── auth.py          # Authentication logic
│   ├── schemas.py       # Pydantic schemas
│   └── main.py          # Application entry
├── frontend/            # Customer React app
├── frontend-bartender/  # Bartender React app
├── admin/              # Admin React app
└── docs/               # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python init_db.py
python main.py
```

### Frontend Setup
```bash
# Customer Portal
cd frontend
npm install
npm run dev

# Bartender Portal
cd frontend-bartender
npm install
npm run dev

# Admin Portal
cd admin
npm install
npm run dev
```

## 🌐 Deployment

See `DEPLOY_NOW.md` for free deployment guide using:
- **Database:** Railway (Free)
- **Backend:** Render (Free)
- **Frontends:** Vercel (Free)

## 📧 Email Configuration

Emails are sent using Resend. Configure in `.env`:
```env
RESEND_API_KEY=your_api_key
FROM_EMAIL=noreply@yourdomain.com
```

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation with Pydantic
- CORS protection
- SQL injection prevention
- XSS protection
- Secure session management

## 📊 Key Features

### Authentication
- Email/password login
- Google OAuth (optional)
- Phone OTP (optional)
- Password reset via email
- 7-day session tokens
- Automatic token refresh

### Payment Flow
- Bottle selection
- Secure checkout
- Payment confirmation
- QR code generation
- Redemption tracking

### QR Code System
- Unique codes per redemption
- Time-limited validity
- One-time use
- Secure validation

## 🧪 Testing

```bash
# Run E2E tests
python test_e2e.py

# Run password reset tests
python test_password_reset.py

# Run token refresh tests
python test_token_refresh.py
```

## 📈 Performance

- Lazy image loading
- Optimized API calls
- Session caching
- Efficient database queries
- CDN delivery (Vercel)

## 🎨 Design

- Modern, premium nightlife aesthetic
- Responsive mobile-first design
- Dark mode optimized
- Smooth animations
- Intuitive user flows

## 📝 Documentation

- `FREE_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `DEPLOY_NOW.md` - Quick start deployment
- `EMAIL_SERVICE_COMPARISON.md` - Email service options
- `RESEND_EMAIL_SETUP_COMPLETE.md` - Email setup guide
- `PASSWORD_RESET_COMPLETE.md` - Password reset implementation
- `TOKEN_REFRESH_COMPLETE.md` - Token refresh implementation

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Developed by Anish Ghanwat

## 🎉 Achievements

- ✅ Complete authentication system
- ✅ Password reset with email
- ✅ Token refresh mechanism
- ✅ 3 fully functional portals
- ✅ QR code system
- ✅ Real-time updates
- ✅ Comprehensive testing
- ✅ Production-ready deployment

## 📞 Support

For support, email: anishghanwat9@gmail.com

---

**Built with ❤️ for the nightlife industry**
