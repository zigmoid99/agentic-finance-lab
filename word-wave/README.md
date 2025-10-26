# Word Wave 🌊

A unique mobile-first word puzzle game inspired by Wordle, built with React, TypeScript, and Tailwind CSS.

## Features

### Game Modes
- **Daily Challenge**: Play one curated word puzzle per day
- **Unlimited Mode**: Play as many rounds as you want with progressive waves
- **Themed Challenges**: Choose from multiple word themes (Classic, Nature, Tech, Space, Food)

### Premium Features
- Unlock all themed word collections
- Tech & Digital vocabulary
- Space & Cosmos terminology
- Food & Cuisine words
- Support development and future updates

### Player Experience
- **Smooth Animations**: Crisp, fluid transitions and effects
- **Mobile-First Design**: Optimized for iOS and Android devices
- **Statistics Tracking**: Track your progress, streaks, and win rates
- **Local Storage**: Your progress is saved automatically
- **PWA Support**: Install as a native app on your device

### Game Mechanics
- 6 attempts to guess a 5-letter word
- Color-coded feedback (Green = correct position, Yellow = wrong position, Gray = not in word)
- Score based on performance (fewer attempts = higher score)
- Wave progression in unlimited mode
- Streak tracking across games

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **PWA** ready for mobile installation
- **Local Storage** for data persistence

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development Roadmap

### Phase 1: Web App (Current)
- ✅ Core game mechanics
- ✅ Mobile-optimized UI
- ✅ Multiple game modes
- ✅ Statistics tracking
- ✅ Theme system
- ✅ PWA configuration

### Phase 2: React Native Migration
- Port to React Native for native iOS/Android apps
- Implement native in-app purchases
- Add haptic feedback
- Integrate app store billing
- Submit to App Store and Google Play

### Phase 3: Enhanced Features
- Multiplayer mode
- Social sharing
- More word themes
- Power-ups and hints
- Achievements system
- Dark mode

## Monetization Strategy

1. **Free Features**:
   - Daily Challenge
   - Unlimited Mode with Classic theme
   - Nature theme
   - Basic statistics

2. **Premium ($2.99)**:
   - All themed word collections
   - Priority access to new features
   - Ad-free experience
   - Support development

3. **Future Options**:
   - Donations/tips
   - Season passes
   - Cosmetic customizations

## Converting to React Native

This app is designed to be easily converted to React Native:

1. Most game logic is in custom hooks (platform-agnostic)
2. UI components use simple, convertible patterns
3. No web-specific APIs used in core logic
4. State management is framework-agnostic

### Migration Steps

```bash
# Initialize React Native project
npx react-native init WordWaveNative --template react-native-template-typescript

# Copy and adapt:
# - src/hooks/* (minimal changes needed)
# - src/data/* (no changes needed)
# - src/types.ts (no changes needed)
# - src/components/* (convert to React Native components)

# Add React Native dependencies
npm install @react-native-async-storage/async-storage
npm install react-native-iap  # For in-app purchases

# Configure app store billing
# - Set up App Store Connect (iOS)
# - Set up Google Play Console (Android)
# - Implement payment verification backend
```

## License

MIT License - feel free to use this as a template for your own word game!

## Contributing

This is a demo project, but suggestions and improvements are welcome!

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using React and TypeScript
