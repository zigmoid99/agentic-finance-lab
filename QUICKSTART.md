# Quick Start Guide

Get Room Designer AI running in 5 minutes!

## Step 1: Get API Keys (2 minutes)

1. **Anthropic API Key**:
   - Go to https://console.anthropic.com/
   - Sign up or log in
   - Navigate to API Keys
   - Create a new key

2. **OpenAI API Key**:
   - Go to https://platform.openai.com/
   - Sign up or log in
   - Navigate to API Keys
   - Create a new key

## Step 2: Backend Setup (1 minute)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
```

Start the server:
```bash
npm run dev
```

You should see: `🚀 Room Designer AI Backend Server`

## Step 3: Mobile App Setup (2 minutes)

Open a new terminal:

```bash
cd mobile
npm install
```

Edit `mobile/src/services/api.ts` (line 9):
- For iOS simulator: `http://localhost:3000`
- For Android emulator: `http://10.0.2.2:3000`
- For physical device: `http://YOUR_COMPUTER_IP:3000`

Start the app:
```bash
npm start
```

Press `i` for iOS or `a` for Android.

## Step 4: Test It!

1. Grant camera permissions
2. Take a photo of any room
3. Tap "What's Missing?"
4. Wait 30-60 seconds
5. View AI suggestions and visualizations!

## Troubleshooting

**Network Error?**
- Make sure backend is running on port 3000
- Check the API_BASE_URL in `mobile/src/services/api.ts`
- For Android emulator, must use `http://10.0.2.2:3000`

**API Error?**
- Verify API keys in `backend/.env`
- Check your API quota/billing on both platforms

**Camera Not Working?**
- Use "Gallery" button to select existing photos
- Grant camera permissions in Settings

## Next Steps

- Read full README.md for detailed documentation
- Check API endpoint examples
- Explore the codebase
- Customize the UI/UX
- Add new features!

---

Need help? Check the Troubleshooting section in README.md
