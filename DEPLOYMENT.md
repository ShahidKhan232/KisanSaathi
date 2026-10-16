# KisanSaathi — Free Deployment Guide

This project has two parts:
- **Frontend** (React + Vite) → deploy on **Vercel**
- **Backend** (Node/Express + TypeScript) → deploy on **Render**
- **Database** (MongoDB) → free tier on **MongoDB Atlas**

---

## Step 1 — MongoDB Atlas (Free Database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → **Sign Up free**
2. Create a free **M0 cluster** (512 MB, enough for this app)
3. Under **Database Access** → Add a database user with a username + password
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere — needed for Render)
5. On the cluster page click **Connect → Drivers** → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/kisan_saathi?retryWrites=true&w=majority
   ```
6. Save this — you'll use it as `MONGO_URI` below

---

## Step 2 — Backend on Render (Free)

### 2a. Prepare the repo

Make sure your `server/package.json` `start` script is:
```json
"start": "node dist/index.js"
```
And `build` is:
```json
"build": "tsc"
```
Both already exist — you're good.

### 2b. Deploy on Render

1. Go to [render.com](https://render.com) → **Sign up free** (use GitHub)
2. **New → Web Service** → connect your GitHub repo
3. Set these fields:

| Field | Value |
|---|---|
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

4. Under **Environment Variables**, add all of these:

```
NODE_ENV=production
PORT=10000
MONGO_URI=<your Atlas connection string from Step 1>
JWT_SECRET=<generate a random 32-char string>
CLIENT_ORIGIN=https://<your-vercel-app>.vercel.app
CLIENT_URL=https://<your-vercel-app>.vercel.app
GEMINI_API_KEY=<your Gemini API key>
GEMINI_MODEL=gemini-2.5-flash
AI_PROVIDER=gemini
MARKET_API_KEY=<your data.gov.in key>
MARKET_API_URL=https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
```

> **Get a free Gemini API key:** [aistudio.google.com](https://aistudio.google.com/app/apikey)  
> **Get a free data.gov.in key:** [data.gov.in](https://data.gov.in/user/register) → My Account → API key

5. Click **Deploy** — Render builds and starts the server. Note your URL:
   ```
   https://kisansaathi-server.onrender.com
   ```

> ⚠️ Free Render instances **spin down after 15 min of inactivity**. First request after sleep takes ~30s to wake up. This is a free-tier limitation.

---

## Step 3 — Frontend on Vercel (Free)

### 3a. Set the Vite config for production

Update `frontend/vite.config.ts` so the API proxy is only used in dev:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['lucide-react'] },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        timeout: 30000
      }
    }
  }
});
```
The proxy only runs in dev (`vite` command). In production the frontend uses `VITE_SERVER_URL`.

### 3b. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up free** (use GitHub)
2. **New Project** → import your GitHub repo
3. Set these fields:

| Field | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Under **Environment Variables**, add:

```
VITE_SERVER_URL=https://kisansaathi-server.onrender.com
```

Also add Firebase variables if you use Firebase Auth:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Click **Deploy** — Vercel builds and publishes. Note your URL:
   ```
   https://kisansaathi.vercel.app
   ```

6. Go back to **Render → your service → Environment Variables** and update:
   ```
   CLIENT_ORIGIN=https://kisansaathi.vercel.app
   CLIENT_URL=https://kisansaathi.vercel.app
   ```
   Then click **Manual Deploy → Clear build cache & deploy** on Render.

---

## Step 4 — Verify Deployment

1. Open `https://kisansaathi.vercel.app`
2. Check the backend health: `https://kisansaathi-server.onrender.com/api/health`
3. Check DB: `https://kisansaathi-server.onrender.com/api/health/database`

---

## Free Tier Limits Summary

| Service | Free Tier Limits |
|---|---|
| **Vercel** | Unlimited static deploys, 100 GB bandwidth/month |
| **Render** | 750 hours/month (≈1 instance 24/7), spins down after 15 min idle |
| **MongoDB Atlas** | 512 MB storage, shared cluster |
| **Gemini API** | 15 requests/min, 1 million tokens/day (Gemini 1.5 Flash) |

---

## Preventing Render Cold Starts (Optional)

To keep the free Render instance warm, add an uptime monitor. Services like [cron-job.org](https://cron-job.org) let you ping a URL every 14 minutes for free:

- URL to ping: `https://kisansaathi-server.onrender.com/api/health`
- Interval: every 14 minutes

---

## Local `.env` Files (Do NOT commit these)

`server/.env`:
```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_local_secret
CLIENT_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
AI_PROVIDER=gemini
MARKET_API_KEY=...
MARKET_API_URL=https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
```

`frontend/.env`:
```env
VITE_SERVER_URL=
```
> Leave `VITE_SERVER_URL` empty in dev — the Vite proxy handles `/api` requests to `localhost:5001`.
