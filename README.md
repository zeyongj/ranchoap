# RanchoAP — Setup Guide

## Tech Stack
- **Frontend**: React + Vite
- **Database**: Firebase Firestore
- **File Storage**: Firebase Storage
- **Deployment**: Vercel (free)

## Step 1 — Install Node.js

1. Go to https://nodejs.org
2. Download and install the **LTS** version (e.g. 20.x)
3. Open Terminal (press Cmd+Space, type "Terminal")
4. Verify: `node -v` should print a version number

## Step 2 — Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `ranchoap` → Continue
3. Disable Google Analytics (not needed) → **Create project**
4. In the left sidebar: **Build → Firestore Database**
   - Click **Create database** → Start in **test mode** → Choose region `us-central` → Done
5. In the left sidebar: **Build → Storage**
   - Click **Get started** → Start in **test mode** → Done
6. In the left sidebar: **Project Overview** (gear icon) → **Project settings**
   - Scroll to **Your apps** → Click **</>** (Web)
   - App nickname: `ranchoap-web` → **Register app**
   - You'll see a config object — **copy it**, you need it next

## Step 3 — Configure the App

1. Open Terminal and navigate to this folder:
   ```
   cd /path/to/ranchoap
   ```
2. Open `src/firebase.js` in any text editor
3. Replace the placeholder values with your Firebase config:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "ranchoap-xxxx.firebaseapp.com",
     projectId: "ranchoap-xxxx",
     storageBucket: "ranchoap-xxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123...:web:abc..."
   };
   ```

## Step 4 — Run Locally

```bash
cd ranchoap
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

**Login credentials:**
- Regular user: any name + password `apvan2026`
- Admin: username `admin` + password `ranchovan1125`
- Senior AP unlock code: `1981`
- Post Payment unlock code: `4255`

## Step 5 — Deploy to Vercel

1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create a new repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/ranchoap.git
   git push -u origin main
   ```

2. Go to https://vercel.com → Sign up with GitHub
3. Click **New Project** → Import your `ranchoap` repo
4. Framework: **Vite** (auto-detected) → **Deploy**
5. Your app will be live at `https://ranchoap.vercel.app` (or similar)

## Features Summary

| Feature | How |
|---------|-----|
| Login | Name + shared password |
| Admin account | username: `admin` |
| Announcements | Admin posts on Home page |
| Calendar schedules | Admin clicks any day on Home |
| Upload files | Admin → Documents tab → Upload |
| Markdown pages | Admin → Documents tab → New Markdown Page |
| Annotations | Click 💬 icon next to any file |
| Discussions | Every sub-page has a Discussion tab |
| Global discuss board | Sidebar → Discuss Board |
| Manual proposals | Users → Proposals tab → Submit |
| Senior AP lock | Code: `1981` |
| Post Payment lock | Code: `4255` |
| Add nav items | Admin → click any section → Add item |
