# 🚀 Deployment Guide - SIMPLE VERSION

## Quick Deploy (30 minutes)

### **STEP 1: Create Database & Redis on Render First**

Before using Blueprint, manually create:

**1. Create PostgreSQL Database:**
1. Go to https://dashboard.render.com/
2. Click "New" → "PostgreSQL"
3. Name: `financial-advisor-db`
4. Database: `financial_advisor_ai`
5. User: `postgres`
6. Region: Oregon (or your choice)
7. PostgreSQL Version: **16**
8. Plan: **Starter** ($7/mo)
9. Click "Create Database"
10. **Copy the Internal Database URL** (it starts with `postgresql://`)

**2. Create Redis:**
1. Click "New" → "Redis"
2. Name: `financial-advisor-redis`
3. Region: Same as database
4. Plan: **Starter** ($7/mo)
5. Click "Create Redis"
6. **Copy the Internal Redis URL** (it starts with `redis://`)

---

### **STEP 2: Push to GitHub**

```bash
cd /Users/soon/web/jump

# Create .env.example files
cat > backend/.env.example << 'EOF'
PORT=3001
NODE_ENV=production
DATABASE_URL=your-postgres-url-here
REDIS_URL=your-redis-url-here
OPENAI_API_KEY=sk-your-key
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=https://your-backend.onrender.com/auth/google/callback
HUBSPOT_CLIENT_ID=your-id
HUBSPOT_CLIENT_SECRET=your-secret
HUBSPOT_REDIRECT_URI=https://your-backend.onrender.com/auth/hubspot/callback
FRONTEND_URL=https://your-frontend.onrender.com
EOF

cat > frontend/.env.example << 'EOF'
VITE_API_URL=https://your-backend.onrender.com
EOF

# Push to GitHub
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub: https://github.com/new
git remote add origin https://github.com/YOUR_USERNAME/financial-advisor-ai.git
git branch -M main
git push -u origin main
```

---

### **STEP 3: Deploy with Blueprint**

1. Go to: https://dashboard.render.com/
2. Click: "New" → "Blueprint"
3. Select your GitHub repo
4. Click: "Apply"
5. **Should work now!** ✅

---

### **STEP 4: Configure Environment Variables**

**Backend Service:**

Add these in the Environment tab:

```
DATABASE_URL = (paste the PostgreSQL Internal URL from Step 1)
REDIS_URL = (paste the Redis Internal URL from Step 1)
OPENAI_API_KEY = sk-your-actual-key
GOOGLE_CLIENT_ID = your-google-client-id
GOOGLE_CLIENT_SECRET = your-google-secret
GOOGLE_REDIRECT_URI = https://YOUR-BACKEND-NAME.onrender.com/auth/google/callback
HUBSPOT_CLIENT_ID = your-hubspot-id
HUBSPOT_CLIENT_SECRET = your-hubspot-secret
HUBSPOT_REDIRECT_URI = https://YOUR-BACKEND-NAME.onrender.com/auth/hubspot/callback
FRONTEND_URL = https://YOUR-FRONTEND-NAME.onrender.com
```

**Frontend Service:**

```
VITE_API_URL = https://YOUR-BACKEND-NAME.onrender.com
```

---

### **STEP 5: Update OAuth Apps**

**Google:**
- Add redirect: `https://YOUR-BACKEND-NAME.onrender.com/auth/google/callback`

**HubSpot:**
- Add redirect: `https://YOUR-BACKEND-NAME.onrender.com/auth/hubspot/callback`

---

### **STEP 6: Enable pgvector Extension**

1. Go to your PostgreSQL database on Render
2. Click "Connect" → Copy the External Database URL
3. Use a tool like pgAdmin or run:
   ```bash
   psql YOUR_EXTERNAL_DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
   ```

OR just run the migration (it will enable pgvector automatically):

1. Backend service → Shell
2. Run: `npm run migrate`

---

### **STEP 7: Test**

Visit your frontend URL and test everything!

---

## 💰 Cost

- PostgreSQL Starter: $7/mo
- Redis Starter: $7/mo
- Backend & Frontend: FREE
- **Total: $14/mo**

---

**That's it! Much simpler!** 🎉
