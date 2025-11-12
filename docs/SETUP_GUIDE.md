# Community Photo Sharing App - Complete Setup Guide

This guide will walk you through setting up the complete development environment for the Community Photo Sharing App.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Database Setup](#database-setup)
4. [Mobile App Setup](#mobile-app-setup)
5. [Running the Complete Stack](#running-the-complete-stack)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js and npm**
   - Version: 18.x or higher
   - Download: https://nodejs.org/
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **PostgreSQL**
   - Version: 14.x or higher
   - Download: https://www.postgresql.org/download/
   - Alternative: Use Docker (see below)

3. **Docker & Docker Compose** (Optional but recommended)
   - Download: https://www.docker.com/products/docker-desktop
   - Verify installation:
     ```bash
     docker --version
     docker-compose --version
     ```

4. **React Native Development Environment**

   **For iOS (macOS only):**
   - Xcode 14.x or higher
   - CocoaPods
     ```bash
     sudo gem install cocoapods
     ```

   **For Android:**
   - Android Studio
   - Android SDK (API 31+)
   - Java Development Kit (JDK) 11
   - Configure ANDROID_HOME environment variable

5. **Git**
   - For version control
   - Download: https://git-scm.com/

## Backend Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd community-photo-app
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install all required dependencies including:
- Express.js
- Prisma
- TypeScript
- bcrypt, jsonwebtoken
- multer, sharp, exifr
- And more...

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_photos?schema=public

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,image/heic

# CORS
CORS_ORIGIN=http://localhost:19006,exp://localhost:19000
```

**Important Security Notes:**
- Generate strong, unique secrets for JWT_SECRET and JWT_REFRESH_SECRET
- Never commit .env file to version control
- Use different secrets for development and production

### Step 4: Create Upload Directory

```bash
mkdir -p uploads
```

## Database Setup

### Option 1: Using Docker (Recommended)

1. **Start PostgreSQL container:**
   ```bash
   cd ..  # Back to project root
   docker-compose up -d postgres
   ```

2. **Verify PostgreSQL is running:**
   ```bash
   docker-compose ps
   ```

### Option 2: Using Local PostgreSQL

1. **Start PostgreSQL service** (method varies by OS)

2. **Create database:**
   ```bash
   psql -U postgres
   CREATE DATABASE community_photos;
   \q
   ```

3. **Update DATABASE_URL in .env** if using different credentials

### Step 5: Run Database Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

This will:
- Generate Prisma Client
- Create all necessary tables
- Set up indexes and constraints

### Step 6: Verify Database Setup

```bash
npm run prisma:studio
```

This opens Prisma Studio at http://localhost:5555 where you can view your database.

## Mobile App Setup

### Step 1: Install Mobile Dependencies

```bash
cd ../mobile
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30000

# For Android Emulator, use: http://10.0.2.2:3000/api
# For iOS Simulator, use: http://localhost:3000/api
# For Physical Device, use: http://YOUR_COMPUTER_IP:3000/api
```

### Step 3: iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### Step 4: Android Setup

1. **Open Android Studio**
2. **Open Android SDK Manager**
3. **Install required SDK versions** (API 31+)
4. **Create/start an Android Virtual Device (AVD)**

### Step 5: Configure Permissions

The app requires camera and location permissions. These are already configured in the starter code:

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to take photos of issues</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to tag photos</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## Running the Complete Stack

### Step 1: Start the Backend

```bash
# Terminal 1
cd backend
npm run dev
```

Expected output:
```
╔════════════════════════════════════════════╗
║  Community Photo Sharing API               ║
║                                            ║
║  Server running on port 3000               ║
║  Environment: development                  ║
║  API Prefix: /api                          ║
╚════════════════════════════════════════════╝
```

### Step 2: Start Metro Bundler

```bash
# Terminal 2
cd mobile
npm start
```

### Step 3: Run Mobile App

**For iOS:**
```bash
# Terminal 3
cd mobile
npm run ios
```

**For Android:**
```bash
# Terminal 3
cd mobile
npm run android
```

### Step 4: Test the Application

1. **Register a new account**
   - Open the app
   - Click "Register"
   - Fill in the form
   - Submit

2. **Create a group**
   - After login, create a new community group
   - Note the invite code

3. **Test photo upload** (when fully implemented)
   - Take a photo
   - Add title and description
   - Upload to group

4. **Test API directly** (using curl or Postman)
   ```bash
   # Health check
   curl http://localhost:3000/health

   # Register user
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```

## Troubleshooting

### Backend Issues

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

#### Database Connection Failed
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists
- Check firewall settings

#### Prisma Migration Errors
```bash
# Reset database (WARNING: deletes all data)
npm run prisma:migrate reset

# Or create a new migration
npm run prisma:migrate dev --name fix_issue
```

### Mobile App Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache
```

#### iOS Build Failures
```bash
# Clean build folder
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

#### Android Build Failures
```bash
# Clean gradle
cd android
./gradlew clean
cd ..
```

#### Cannot Connect to API

**iOS Simulator:**
- Use `http://localhost:3000/api`

**Android Emulator:**
- Use `http://10.0.2.2:3000/api`

**Physical Device:**
- Ensure phone and computer on same WiFi
- Use computer's IP address: `http://192.168.1.X:3000/api`
- Check firewall allows connections on port 3000

### Camera/Location Permission Issues

**iOS:**
- Delete app and reinstall
- Check Info.plist has correct descriptions

**Android:**
- Go to Settings > Apps > Community Photos > Permissions
- Manually grant camera and location permissions

## Next Steps

After successful setup:

1. **Explore the codebase**
   - Backend: `backend/src/`
   - Mobile: `mobile/src/`

2. **Read the architecture docs**
   - See `ARCHITECTURE.md`

3. **Start developing**
   - Add new features
   - Customize UI
   - Extend API

4. **Deploy to production**
   - See deployment guides in README.md

## Getting Help

If you encounter issues not covered here:

1. Check existing GitHub issues
2. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, versions, etc.)
3. Contact support@example.com

## Useful Commands Reference

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run prisma:studio # Open database GUI
npm test             # Run tests
```

### Mobile
```bash
npm start            # Start Metro bundler
npm run ios          # Run on iOS
npm run android      # Run on Android
npm test             # Run tests
npm run lint         # Lint code
```

### Docker
```bash
docker-compose up    # Start all services
docker-compose down  # Stop all services
docker-compose logs  # View logs
```

Happy coding! 🚀
