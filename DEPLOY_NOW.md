# 🚀 DEPLOY NOW - Copy & Paste Commands

## ✅ render.yaml is FIXED and ready!

---

## 📦 **STEP 1: Create .env.example Files**

Copy and paste these commands:

```bash
cd /Users/soon/web/jump

cat > backend/.env.example << 'EOF'
PORT=3001
NODE_ENV=production
SESSION_SECRET=generate-random-secret
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
OPENAI_API_KEY=sk-your-key
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=https://your-backend.onrender.com/auth/google/callback
HUBSPOT_CLIENT_ID=your-id
HUBSPOT_CLIENT_SECRET=your-secret
HUBSPOT_REDIRECT_URI=https://your-backend.onrender.com/auth/hubspot/callback
FRONTEND_URL=https://your-frontend.onrender.com
POLLING_INTERVAL=5
EOF

cat > frontend/.env.example << 'EOF'
VITE_API_URL=https://your-backend.onrender.com
EOF
```

---

## 📤 **STEP 2: Push to GitHub**

```bash
git add .
git commit -m "Financial Advisor AI - Challenge Submission"

# Create repo at: https://github.com/new
# Name: financial-advisor-ai
# Public
# Then:

git remote add origin https://github.com/YOUR_USERNAME/financial-advisor-ai.git
git branch -M main
git push -u origin main
```

---

## 🎯 **STEP 3: Deploy on Render**

1. Visit: https://dashboard.render.com/
2. Click: **"New"** → **"Blueprint"**
3. Connect GitHub
4. Select: `financial-advisor-ai`
5. Click: **"Apply"**
6. Wait ~10 minutes

---

## ⚙️ **STEP 4: Add Environment Variables**

After deployment, configure the backend:

1. Go to **financial-advisor-backend** service
2. Click **"Environment"**
3. Add these (with your actual values):

```
OPENAI_API_KEY = sk-proj-...
GOOGLE_CLIENT_ID = ...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = ...
HUBSPOT_CLIENT_ID = ...
HUBSPOT_CLIENT_SECRET = ...
```

4. After you see the Render URLs in the dashboard, add:

```
GOOGLE_REDIRECT_URI = https://financial-advisor-backend-XXXX.onrender.com/auth/google/callback
HUBSPOT_REDIRECT_URI = https://financial-advisor-backend-XXXX.onrender.com/auth/hubspot/callback
FRONTEND_URL = https://financial-advisor-frontend-XXXX.onrender.com
```

5. Click **"Save Changes"**

---

## 🎨 **STEP 5: Configure Frontend**

1. Go to **financial-advisor-frontend** service
2. Click **"Environment"**
3. Add:

```
VITE_API_URL = https://financial-advisor-backend-XXXX.onrender.com
```

4. Click **"Save Changes"**

---

## 🔐 **STEP 6: Update OAuth Apps**

**Google:**
- https://console.cloud.google.com/ → Credentials
- Add redirect: `https://financial-advisor-backend-XXXX.onrender.com/auth/google/callback`

**HubSpot:**
- https://developers.hubspot.com/ → Your App → Auth
- Add redirect: `https://financial-advisor-backend-XXXX.onrender.com/auth/hubspot/callback`

---

## 🗄️ **STEP 7: Run Migration**

1. Backend service → **Shell**
2. Run:
```bash
npm run migrate
```

---

## ✅ **STEP 8: Test & Submit**

Visit: `https://financial-advisor-frontend-XXXX.onrender.com`

Test:
- ✓ Login with Google
- ✓ Connect HubSpot  
- ✓ Sync data
- ✓ Ask questions

Submit:
- GitHub: `https://github.com/YOUR_USERNAME/financial-advisor-ai`
- App: Your Render frontend URL

---

## 💰 **Cost**: FREE

- Database: $7/mo (starter)
- Redis: $7/mo (starter)
- Backend: FREE (spins down after 15 min)
- Frontend: FREE
- **Total: $14/mo** (or free for 90-day trial)

---

**You're ready! Just follow the steps above!** 🎉

