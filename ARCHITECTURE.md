# Community Photo Sharing App - Architecture

## Overview
A cross-platform mobile application for residential communities to report and manage infrastructure issues through geotagged photos with voting and role-based access.

## Technology Stack

### Mobile App
- **Framework**: React Native (cross-platform iOS & Android)
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **Camera**: react-native-camera or expo-camera
- **Geolocation**: @react-native-community/geolocation
- **Image Handling**: react-native-image-picker, react-native-image-resizer
- **HTTP Client**: Axios
- **Storage**: AsyncStorage for local data

### Backend API
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Joi or express-validator
- **File Upload**: Multer
- **Image Processing**: Sharp
- **CORS**: cors middleware

### Database
- **Primary DB**: PostgreSQL 14+
- **ORM**: Prisma
- **Migrations**: Prisma Migrate

### File Storage
- **Development**: Local filesystem
- **Production**: AWS S3 or similar cloud storage

### DevOps
- **Containerization**: Docker & Docker Compose
- **Environment Management**: dotenv

## System Architecture

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         │ HTTPS/REST API
         │
┌────────▼────────┐
│   API Gateway   │
│   (Express)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼─────┐
│ Auth  │ │Business│
│Service│ │ Logic  │
└───┬───┘ └──┬─────┘
    │        │
    └────┬───┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│    Database     │
└─────────────────┘

┌─────────────────┐
│  File Storage   │
│   (S3/Local)    │
└─────────────────┘
```

## Database Schema

### Users
- id (UUID, PK)
- email (unique)
- password_hash
- first_name
- last_name
- phone
- role (enum: RESIDENT, HOA_ADMIN, CONTRACTOR)
- created_at
- updated_at

### UserGroups
- id (UUID, PK)
- name
- description
- community_address
- created_by (FK -> Users)
- created_at
- updated_at

### UserGroupMembers
- id (UUID, PK)
- user_id (FK -> Users)
- group_id (FK -> UserGroups)
- role (enum: MEMBER, ADMIN)
- joined_at

### Photos
- id (UUID, PK)
- user_id (FK -> Users)
- group_id (FK -> UserGroups)
- title
- description
- file_path
- file_size
- mime_type
- latitude
- longitude
- location_accuracy
- taken_at (timestamp from EXIF or device)
- uploaded_at
- status (enum: PENDING, APPROVED, RESOLVED, ARCHIVED)
- vote_count (cached for performance)

### Votes
- id (UUID, PK)
- photo_id (FK -> Photos)
- user_id (FK -> Users)
- vote_type (enum: UPVOTE, DOWNVOTE)
- created_at
- Unique constraint on (photo_id, user_id)

### Comments (optional future feature)
- id (UUID, PK)
- photo_id (FK -> Photos)
- user_id (FK -> Users)
- content
- created_at
- updated_at

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/refresh - Refresh JWT token
- GET /api/auth/me - Get current user profile

### User Groups
- POST /api/groups - Create new group
- GET /api/groups - List user's groups
- GET /api/groups/:id - Get group details
- PUT /api/groups/:id - Update group
- DELETE /api/groups/:id - Delete group
- POST /api/groups/:id/members - Add member to group
- DELETE /api/groups/:id/members/:userId - Remove member
- GET /api/groups/:id/members - List group members

### Photos
- POST /api/photos - Upload photo with metadata
- GET /api/photos - List photos (filtered by group)
- GET /api/photos/:id - Get photo details
- PUT /api/photos/:id - Update photo details
- DELETE /api/photos/:id - Delete photo
- PATCH /api/photos/:id/status - Update photo status (HOA only)

### Votes
- POST /api/photos/:id/vote - Cast or update vote
- DELETE /api/photos/:id/vote - Remove vote
- GET /api/photos/:id/votes - Get vote statistics

## Security Considerations

1. **Authentication**: JWT-based with refresh tokens
2. **Authorization**: Role-based access control (RBAC)
3. **File Upload**:
   - Validate file types (only images)
   - Limit file sizes (max 10MB)
   - Sanitize filenames
   - Virus scanning (production)
4. **API Rate Limiting**: Prevent abuse
5. **Input Validation**: Validate all inputs
6. **SQL Injection**: Use parameterized queries (Prisma ORM)
7. **XSS Protection**: Sanitize user inputs
8. **HTTPS**: Required for all communications

## Mobile App Features

### Core Screens
1. **Authentication**
   - Login
   - Register
   - Forgot Password

2. **Home/Dashboard**
   - List of user's groups
   - Recent photos feed

3. **Group Management**
   - Create group
   - Join group (via invite code)
   - View group members
   - Leave group

4. **Photo Capture**
   - Camera interface
   - Auto-capture GPS coordinates
   - Auto-capture timestamp
   - Add title and description
   - Preview before upload

5. **Photo Gallery**
   - Grid view of photos
   - Filter by status
   - Sort by date/votes
   - Map view (optional)

6. **Photo Details**
   - Full image view
   - Metadata display
   - Voting interface
   - Comments (future)
   - Status updates (HOA role)

7. **Profile**
   - User settings
   - Role display
   - Logout

## Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Project setup and structure
- Database schema and migrations
- Basic authentication API
- User registration and login

### Phase 2: Core Backend (Weeks 3-4)
- User group management APIs
- Photo upload with metadata extraction
- File storage integration
- Photo retrieval APIs

### Phase 3: Voting System (Week 5)
- Voting APIs
- Vote counting and caching
- Photo status management

### Phase 4: Mobile App - Auth (Weeks 6-7)
- React Native project setup
- Navigation structure
- Authentication screens
- API integration

### Phase 5: Mobile App - Photos (Weeks 8-10)
- Camera integration
- GPS and metadata capture
- Photo upload with progress
- Photo gallery implementation

### Phase 6: Mobile App - Social (Week 11)
- Voting UI
- Group management UI
- User profiles
- Role-based UI elements

### Phase 7: Polish & Testing (Week 12)
- Bug fixes
- Performance optimization
- Security audit
- Documentation
- Deployment preparation

## Deployment Strategy

### Backend
- Docker container
- Environment-based configuration
- Health check endpoints
- Logging and monitoring

### Database
- Automated backups
- Connection pooling
- Read replicas (future scaling)

### Mobile App
- iOS: App Store via TestFlight then production
- Android: Google Play Store via internal testing then production

## Future Enhancements
1. Push notifications for new photos, votes, status updates
2. Comments system
3. Photo annotations/markup
4. Export reports (PDF) for HOA meetings
5. Integration with contractor management systems
6. Photo before/after comparison for resolved issues
7. Heat map of issues in community
8. Analytics dashboard for HOA admins
9. Multi-language support
10. Dark mode
