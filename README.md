# Community Photo Sharing App

A cross-platform mobile application for residential communities to report and manage infrastructure issues through geotagged photos with voting and role-based access control.

## Overview

This application enables residents to:
- Take photos of community infrastructure issues (potholes, broken pipes, etc.)
- Automatically tag photos with GPS coordinates and timestamps
- Share photos with community groups
- Vote on reported issues to prioritize them
- Enable HOA admins to track and manage issue resolution
- Allow contractors to access issue details and locations

## Project Structure

```
.
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # App entry point
│   ├── prisma/             # Database schema
│   └── uploads/            # Photo storage
│
├── mobile/                  # React Native mobile app
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── screens/        # App screens
│   │   ├── store/          # Redux store
│   │   └── utils/          # Utility functions
│   └── App.tsx             # App entry point
│
├── docs/                    # Documentation
├── ARCHITECTURE.md          # System architecture
└── README.md               # This file
```

## Technology Stack

### Backend
- Node.js 18+ with TypeScript
- Express.js framework
- PostgreSQL database with Prisma ORM
- JWT authentication
- Image processing (Sharp, Exifr)

### Mobile
- React Native 0.73+
- TypeScript
- Redux Toolkit for state management
- React Navigation
- Camera and geolocation integration

## Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Mobile Setup

```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with API URL
npm run ios     # or npm run android
```

### Using Docker

```bash
docker-compose up -d
```

## Features

✅ User authentication and authorization
✅ User group management
✅ Photo upload with GPS and timestamp metadata
✅ Voting system
✅ Role-based access (Resident, HOA Admin, Contractor)
✅ RESTful API with validation
✅ Mobile app with authentication

🚧 Photo gallery screens
🚧 Push notifications
🚧 Comments system
🚧 Map view
🚧 Analytics dashboard

## Documentation

- [Setup Guide](docs/SETUP_GUIDE.md) - Detailed setup instructions
- [Architecture](ARCHITECTURE.md) - System design and architecture
- API Documentation - See backend/src/routes/

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - List user's groups
- `POST /api/groups/join` - Join group with invite code

### Photos
- `POST /api/photos` - Upload photo
- `GET /api/photos` - List photos
- `POST /api/photos/:id/vote` - Vote on photo

## Development

```bash
# Backend
cd backend
npm run dev          # Development server
npm run build        # Build for production
npm run prisma:studio # Database GUI

# Mobile
cd mobile
npm start            # Metro bundler
npm run ios          # iOS simulator
npm run android      # Android emulator
```

## Testing

```bash
# Backend tests
cd backend
npm test

# Mobile tests
cd mobile
npm test
```

## Deployment

### Backend
- Build Docker image
- Deploy to cloud platform (AWS, GCP, Azure)
- Set environment variables
- Run database migrations

### Mobile
- iOS: Build and submit to App Store
- Android: Build APK/AAB and submit to Google Play

## Security

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Input validation on all endpoints
- File upload restrictions
- CORS configuration
- SQL injection protection via Prisma

## License

MIT License

## Support

For issues or questions:
- Create an issue on GitHub
- See [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for troubleshooting

## Roadmap

**Phase 1 (Current)** - Core functionality
**Phase 2** - Enhanced mobile UI and features
**Phase 3** - Analytics and reporting
**Phase 4** - Advanced features and optimizations