# Assets Directory

This directory should contain the app icons and splash screen images.

## Required Assets

When building for production, you'll need:

- `icon.png` - 1024x1024px app icon
- `adaptive-icon.png` - 1024x1024px Android adaptive icon
- `splash.png` - 1284x2778px splash screen
- `favicon.png` - 48x48px web favicon

## Quick Setup

For development, Expo will use default assets if these files are missing.

For production builds, you can:

1. Design custom icons using tools like:
   - Figma
   - Canva
   - Adobe Illustrator

2. Use online generators:
   - https://www.appicon.co/
   - https://icon.kitchen/

3. Or use Expo's asset generation:
   ```bash
   npx expo-optimize
   ```

## Icon Design Tips

- Use a simple, recognizable design
- Ensure good contrast
- Test on both light and dark backgrounds
- Include some padding around edges (safe zone)
- Use vector graphics when possible

For now, you can continue development without custom assets.
