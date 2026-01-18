# Railway Deployment Guide

## Prerequisites

- GitHub account (to connect your repository)
- Railway account (sign up at https://railway.app)
- Your backend code pushed to GitHub

## Step 1: Prepare Your Backend

Your backend is already set up in the `/backend` folder with:
- ✅ `main.py` - FastAPI application
- ✅ `requirements.txt` - Python dependencies
- ✅ `Dockerfile` (if present)

## Step 2: Create Railway Project

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your repository: `Lobi-test`
6. Railway will detect your Python app

## Step 3: Configure Build Settings

Railway should auto-detect Python, but verify:

1. Click on your deployment
2. Go to **Settings** tab
3. Under **Build**, check:
   - **Root Directory**: `backend`
   - **Build Command**: (leave empty, uses Dockerfile or buildpacks)
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Step 4: Set Environment Variables

1. Go to **Variables** tab
2. Add these variables:

```
PORT=8000
PYTHON_VERSION=3.12
```

If you need any other environment variables (API keys, etc.), add them here.

## Step 5: Install Playwright (If Using Scraper)

Since your scraper uses Playwright, you need to add a build step:

### Option A: Use nixpacks (Recommended)

1. Create `backend/nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["python312", "chromium"]

[phases.install]
cmds = [
    "pip install -r requirements.txt",
    "playwright install chromium",
    "playwright install-deps chromium"
]

[start]
cmd = "uvicorn main:app --host 0.0.0.0 --port $PORT"
```

### Option B: Use Dockerfile (Already exists)

Make sure your `backend/Dockerfile` includes Playwright installation:

```dockerfile
FROM python:3.12-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium
RUN playwright install-deps chromium

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Step 6: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Or click **"Deploy"** button in Railway dashboard
3. Wait for build to complete (2-5 minutes)
4. Check logs for any errors

## Step 7: Get Your Backend URL

1. Once deployed, go to **Settings** tab
2. Scroll to **Domains** section
3. Click **"Generate Domain"**
4. You'll get a URL like: `https://your-app.up.railway.app`
5. **Copy this URL** - you'll need it for your mobile app

## Step 8: Test Your Backend

Test the health check endpoint:

```bash
curl https://your-app.up.railway.app/
```

Should return:
```json
{
  "status": "running",
  "message": "Shein Cart Scraper API",
  "playwright_available": true
}
```

Test the scraper:
```bash
curl -X POST https://your-app.up.railway.app/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://shein-cart-url-here"}'
```

## Step 9: Update Your Mobile App

Update `mobile-app/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 10: Enable Auto-Deploy

1. In Railway, go to **Settings**
2. Under **Source**, check **"Auto Deploy"**
3. Now every push to your main branch will auto-deploy

## Common Issues & Solutions

### Issue: Build fails with "playwright not found"

**Solution**: Add Playwright installation to build phase:
- Use nixpacks.toml (Option A above)
- Or ensure Dockerfile has `playwright install` commands

### Issue: "Port already in use"

**Solution**: Railway assigns a PORT environment variable. Make sure your app uses it:
```python
import os
port = int(os.getenv("PORT", 8000))
uvicorn.run(app, host="0.0.0.0", port=port)
```

### Issue: CORS errors from mobile app

**Solution**: Verify CORS settings in `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Scraper fails in production

**Solution**: Playwright may need additional dependencies:
- Use headless mode (already set to `True`)
- Increase timeout values if needed
- Check Railway logs for specific errors

### Issue: 502 Bad Gateway

**Solution**: 
- Check if app is binding to `0.0.0.0` not `127.0.0.1`
- Verify PORT environment variable is used correctly
- Check Railway logs for startup errors

## Monitoring

### View Logs
1. Go to Railway dashboard
2. Click on your deployment
3. Go to **Deployments** tab
4. Click on latest deployment
5. View real-time logs

### Check Metrics
1. Go to **Metrics** tab
2. Monitor CPU, Memory, Network usage

## Pricing

Railway offers:
- **$5 free credit** per month
- Pay-as-you-go after that
- Typical usage: $5-20/month for small apps

## Scaling

If your app grows:

1. Go to **Settings** → **Resources**
2. Adjust:
   - Memory limit
   - CPU allocation
   - Replicas (for high availability)

## Alternative: Manual Deploy via CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

## Best Practices

1. **Use Environment Variables**: Never hardcode secrets
2. **Enable Health Checks**: Railway can auto-restart if app crashes
3. **Monitor Logs**: Check regularly for errors
4. **Set up Alerts**: Configure notifications for downtime
5. **Use Git Tags**: Deploy specific versions using tags

## Your Backend is Now Live! 🚀

Your FastAPI backend with Playwright scraper is deployed and accessible at:
`https://your-app.up.railway.app`

Update your mobile app's API URL and start testing!
