# Room Designer AI

An AI-powered mobile app that helps you visualize what's missing in your space. Take a photo of any room, and get intelligent suggestions for furnishings, accessories, and decor - complete with AI-generated visualizations showing how they would look.

## Features

- 📸 **Camera Integration** - Take photos or select from gallery
- 🤖 **AI Analysis** - Claude Vision analyzes your space and identifies what's missing
- 💡 **Smart Suggestions** - Get personalized recommendations for furniture, decor, and accessories
- 🎨 **Visual Previews** - See AI-generated images showing how suggested items would look
- 📱 **Cross-Platform** - Works on iOS and Android

## Tech Stack

### Backend
- **Node.js** with Express and TypeScript
- **Anthropic Claude** (3.5 Sonnet) for image analysis
- **OpenAI DALL-E 3** for image generation
- RESTful API design

### Mobile App
- **React Native** with Expo
- **TypeScript** for type safety
- **Expo Camera** for photo capture
- **Expo Image Picker** for gallery access

## Project Structure

```
room-designer-ai/
├── backend/                 # Node.js backend server
│   ├── src/
│   │   ├── services/       # Claude & OpenAI integrations
│   │   ├── routes/         # API endpoints
│   │   ├── types.ts        # TypeScript types
│   │   ├── config.ts       # Configuration
│   │   └── index.ts        # Main server file
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                  # React Native mobile app
│   ├── src/
│   │   ├── screens/        # UI screens
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helper functions
│   ├── App.tsx             # Main app component
│   ├── app.json            # Expo configuration
│   └── package.json
│
└── README.md
```

## Prerequisites

- **Node.js** 18+ and npm
- **Anthropic API Key** - Get from [Anthropic Console](https://console.anthropic.com/)
- **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/)
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **iOS Simulator** (Mac only) or **Android Emulator** for testing

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dev-sandbox
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your API keys:
# ANTHROPIC_API_KEY=your_anthropic_key_here
# OPENAI_API_KEY=your_openai_key_here
nano .env

# Build TypeScript
npm run build

# Start the server
npm run dev
```

The backend server will start on `http://localhost:3000`

### 3. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Create environment file (optional)
cp .env.example .env

# Update API_BASE_URL in .env based on your setup:
# - iOS Simulator: http://localhost:3000
# - Android Emulator: http://10.0.2.2:3000
# - Physical Device: http://YOUR_COMPUTER_IP:3000

# Or update directly in mobile/src/services/api.ts
```

**Update API URL:**

Edit `mobile/src/services/api.ts` and set the correct `API_BASE_URL`:

```typescript
// For iOS simulator
const API_BASE_URL = 'http://localhost:3000';

// For Android emulator
const API_BASE_URL = 'http://10.0.2.2:3000';

// For physical device (replace with your computer's IP)
const API_BASE_URL = 'http://192.168.1.100:3000';
```

### 4. Run the Mobile App

```bash
# Start Expo development server
npm start

# Or directly run on a platform:
npm run ios      # Run on iOS simulator
npm run android  # Run on Android emulator
```

This will open the Expo DevTools in your browser. You can:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your physical device

## Usage

1. **Launch the app** on your device or simulator
2. **Grant camera permissions** when prompted
3. **Take a photo** of a room, office space, or any area
4. **Tap "What's Missing?"** to analyze the image
5. **Wait for AI analysis** (usually 30-60 seconds)
6. **View results** including:
   - Space type identification
   - Current items detected
   - Personalized suggestions
   - AI-generated visualizations

## API Endpoints

### POST `/api/analyze`
Analyze an image and get suggestions (without generating images)

**Request:**
```json
{
  "imageBase64": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "spaceType": "living room",
    "currentItems": ["sofa", "coffee table"],
    "imageDescription": "A modern living room...",
    "suggestions": [
      {
        "item": "Floor Lamp",
        "reasoning": "Would add ambient lighting...",
        "placement": "Next to the sofa",
        "priority": "high"
      }
    ]
  }
}
```

### POST `/api/generate`
Generate enhanced images for given suggestions

**Request:**
```json
{
  "imageBase64": "base64_encoded_image_string",
  "suggestions": [...],
  "imageDescription": "..."
}
```

### POST `/api/analyze-and-generate`
Combined endpoint - analyzes and generates images in one call

**Request:**
```json
{
  "imageBase64": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": { ... },
    "generatedImages": [
      {
        "suggestion": { ... },
        "imageUrl": "https://..."
      }
    ]
  }
}
```

## Troubleshooting

### Backend Issues

**"Missing environment variables" warning:**
- Ensure `.env` file exists in `backend/` directory
- Add valid `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`

**Server won't start:**
- Check if port 3000 is available: `lsof -i :3000`
- Install dependencies: `cd backend && npm install`

### Mobile App Issues

**"Network request failed":**
- Ensure backend server is running
- Check API_BASE_URL in `mobile/src/services/api.ts`
- For Android emulator, use `http://10.0.2.2:3000`
- For physical device, use your computer's local IP

**Camera not working:**
- Grant camera permissions in device settings
- On iOS simulator, camera may not work (use image picker instead)

**Expo build errors:**
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Image Analysis Issues

**"Could not parse JSON from Claude response":**
- This is usually temporary - try again
- Check if ANTHROPIC_API_KEY is valid

**DALL-E image generation fails:**
- Verify OPENAI_API_KEY is valid
- Check OpenAI API quota/billing
- Generation can take 30-60 seconds, be patient

## Cost Considerations

This app uses paid AI services:

- **Anthropic Claude**: ~$3 per 1000 image analyses (Claude 3.5 Sonnet)
- **OpenAI DALL-E 3**: ~$0.04 per image generated (standard quality, 1024x1024)

**Example costs:**
- 100 room analyses: ~$0.30
- 100 generated images (3 per analysis): ~$12
- **Total for 100 uses: ~$12.30**

Set up billing alerts in both platforms to monitor usage.

## Development

### Backend Development

```bash
cd backend
npm run dev  # Auto-restarts on file changes
```

### Mobile Development

```bash
cd mobile
npm start    # Opens Expo DevTools
```

Press `r` to reload the app after making changes.

## Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Mobile App

```bash
cd mobile

# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform ios
eas build --platform android
```

## Future Enhancements

- [ ] Support for multiple suggestion visualizations per item
- [ ] Save/share favorite designs
- [ ] Shopping links for suggested items
- [ ] AR preview (place items in real space)
- [ ] Room style presets (modern, traditional, minimalist, etc.)
- [ ] Budget-based filtering
- [ ] User accounts and history
- [ ] Image editing before submission

## License

MIT

## Credits

- **AI Models**: Anthropic Claude 3.5 Sonnet, OpenAI DALL-E 3
- **Mobile Framework**: React Native & Expo
- **Backend**: Node.js & Express

---

**Built with Claude Code**

For issues or questions, please open an issue on GitHub.
