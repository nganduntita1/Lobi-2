# Shein Cart Scraper - Full Stack Application

A mobile and web application to scrape Shein cart URLs and extract product information.

## 🏗️ Architecture

- **Frontend**: Expo (React Native) - iOS, Android, and Web
- **Backend**: FastAPI (Python) with Playwright - Deployed on Railway
- **Web Deployment**: Netlify

## 📱 Features

- ✅ Paste Shein cart URL
- ✅ In-app WebView for CAPTCHA solving
- ✅ Extract product details (name, price, image, quantity)
- ✅ Clean, modern UI
- ✅ Works on iOS, Android, and Web

## 🚀 Quick Start

### Backend (Railway)

1. **Deploy to Railway**:
   ```bash
   cd backend
   ```

2. **Create a new Railway project**:
   - Go to [Railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository
   - Railway will automatically detect the Dockerfile
   
3. **Configure Environment**:
   - No environment variables needed initially
   - Railway will assign a public URL

4. **Get your API URL**:
   - Copy the Railway public URL (e.g., `https://your-app.railway.app`)

### Mobile App (Expo)

1. **Install Dependencies**:
   ```bash
   cd mobile-app
   npm install
   ```

2. **Configure API URL**:
   ```bash
   cp .env.example .env
   # Edit .env and set EXPO_PUBLIC_API_URL to your Railway URL
   ```

3. **Run the App**:
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

### Deploy Web Version to Netlify

1. **Build for Web**:
   ```bash
   npm run build:web
   ```

2. **Deploy to Netlify**:
   
   **Option A: Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

   **Option B: Netlify Dashboard**
   - Go to [Netlify](https://netlify.com)
   - Drag and drop the `dist` folder
   - Or connect your GitHub repo
   - Build command: `npm run build:web`
   - Publish directory: `dist`

## 📦 Project Structure

```
Lobi-test/
├── backend/                # FastAPI backend
│   ├── main.py            # API endpoints
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile         # Docker configuration
│   └── railway.json       # Railway configuration
│
├── mobile-app/            # Expo app
│   ├── src/
│   │   ├── screens/       # Main screens
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API calls
│   │   └── types/         # TypeScript types
│   ├── App.tsx           # Entry point
│   ├── package.json      # Dependencies
│   └── netlify.toml      # Netlify config
│
└── scrape_shein_manual.py # Original Python scraper
```

## 🔧 How It Works

### Mobile/Web Flow

1. User pastes Shein cart URL
2. App opens WebView with the URL
3. User solves any CAPTCHAs manually
4. User taps "Extract Items"
5. JavaScript extracts cart data from DOM
6. Items are displayed in a clean list

### Backend API (Optional)

The backend API can be used for server-side scraping:

```bash
POST /scrape
{
  "url": "https://api-shein.shein.com/h5/sharejump/..."
}

Response:
{
  "success": true,
  "items": [...],
  "total_items": 5
}
```

**Note**: The mobile app uses in-app WebView extraction and doesn't require the backend for basic functionality. The backend is included for future server-side scraping needs.

## 🌐 API Endpoints

- `GET /` - Health check
- `POST /scrape` - Scrape a cart URL

## 🛠️ Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --reload
```

Access API docs at: `http://localhost:8000/docs`

### Mobile App

```bash
cd mobile-app
npm install
npm start
```

Press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

## 📱 Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

### Web

```bash
npm run build:web
```

## 🚨 Important Notes

### CAPTCHA Handling

Shein uses CAPTCHAs to prevent bot scraping. This app handles it by:
- Opening the URL in a WebView
- Letting users solve CAPTCHAs manually
- Extracting data only after the page is fully loaded

### Limitations

- The cart URL must be valid and not expired
- Some cart URLs may redirect to the homepage
- Server-side scraping (backend API) may be blocked by Shein's anti-bot measures
- Best results with the WebView approach (mobile/web app)

## 🔐 Environment Variables

### Mobile App (.env)

```env
EXPO_PUBLIC_API_URL=https://your-railway-app.railway.app
```

### Backend (Railway)

No environment variables required - Railway handles everything automatically.

## 📄 License

MIT

## 🤝 Contributing

Pull requests are welcome!

## 💡 Tips

1. **For best results**: Use the mobile/web app with WebView approach
2. **Railway free tier**: 500 hours/month (plenty for development)
3. **Netlify free tier**: Unlimited personal projects
4. **Expo free tier**: Unlimited builds and updates

## 🆘 Troubleshooting

### Backend deployment fails on Railway
- Make sure Dockerfile is present
- Check Railway logs for errors
- Verify Playwright installation succeeds

### WebView not loading cart
- Check if the URL is valid
- Try opening the URL in a regular browser first
- Some share URLs may expire

### No items extracted
- Make sure CAPTCHAs are solved
- Wait for the cart page to fully load
- Check browser console for errors

## 📞 Support

For issues, please create a GitHub issue with:
- Device/platform (iOS/Android/Web)
- Error message or screenshot
- Cart URL (if possible)

---

Built with ❤️ using Expo, FastAPI, and Playwright
