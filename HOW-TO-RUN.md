# How to Run This App

## Prerequisites

Install these first:
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/downloads)

## Setup Steps

### 1. Clone and Install

```bash
cd Lobi-test
```

### 2. Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

### 3. Setup Mobile App

```bash
cd ../mobile-app
npm install
```

Create `.env` file in `mobile-app` folder:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Running the App

### Terminal 1: Start Backend

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload
```

Backend runs at: http://localhost:8000

### Terminal 2: Start Mobile App

```bash
cd mobile-app
npm start
```

Choose your platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on your phone

## Testing Backend

Open http://localhost:8000/docs in your browser to test the API.

## Troubleshooting

**Backend won't start?**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again

**Mobile app errors?**
- Delete `node_modules` and run `npm install` again
- Make sure `.env` file exists with Supabase credentials

**Playwright errors?**
- Run `playwright install chromium` again
