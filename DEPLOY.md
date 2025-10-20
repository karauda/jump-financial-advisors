# 🚀 Deployment Guide

Quick guide to deploy this application to Render.

## Prerequisites

- GitHub account
- Render account (free): https://render.com
- All OAuth credentials configured

## Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/financial-advisor-ai.git
git push -u origin main
```

### 2. Deploy on Render

1. Go to https://dashboard.render.com/
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create 4 services
5. Click "Apply"

### 3. Configure Environment Variables

**Backend service** - Add these variables:
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (use your Render backend URL)
- `HUBSPOT_CLIENT_ID`
- `HUBSPOT_CLIENT_SECRET`
- `HUBSPOT_REDIRECT_URI` (use your Render backend URL)
- `FRONTEND_URL` (use your Render frontend URL)

**Frontend service** - Add:
- `VITE_API_URL` (use your Render backend URL)

### 4. Update OAuth Apps

**Google Cloud Console:**
- Add redirect: `https://YOUR-BACKEND.onrender.com/auth/google/callback`

**HubSpot Developer:**
- Add redirect: `https://YOUR-BACKEND.onrender.com/auth/hubspot/callback`

### 5. Run Migration

1. Go to backend service → Shell
2. Run: `npm run migrate`

### 6. Test

Visit your frontend URL and test all features!

## Required Scopes

**Google OAuth:**
- Gmail modify
- Calendar
- Profile & email

**HubSpot OAuth:**
- `crm.objects.contacts.read`
- `crm.objects.contacts.write`
- `crm.schemas.contacts.read`
- `crm.schemas.contacts.write`
- `crm.objects.companies.read`
- `crm.objects.deals.read`

## Support

For issues, check the Render logs in the dashboard.

