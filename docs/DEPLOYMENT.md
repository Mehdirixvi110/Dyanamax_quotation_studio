# Deployment Guide — Neon + Render + Vercel

This guide walks you through deploying the Construction Quotation Studio using free-tier services.

---

## Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Vercel         │──────▶│   Render         │──────▶│   Neon           │
│   (Frontend)     │  API  │   (Backend)      │  DB   │   (PostgreSQL)   │
│   React + Vite   │       │   NestJS         │       │   Free 500MB     │
│   Free           │       │   Free           │       │   Free forever   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## Step 1: Set Up Neon Database (2 minutes)

1. Go to [https://neon.tech](https://neon.tech) and sign up (GitHub login works)
2. Click **"New Project"**
3. Name it: `quotation-studio`
4. Region: Choose closest to you
5. Click **"Create Project"**
6. Copy the **connection string** — it looks like:
   ```
   postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
7. Save this — you'll need it for Render.

---

## Step 2: Push Code to GitHub

1. Create a new GitHub repository
2. From your project root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Quotation Studio v1.0"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/quotation-studio.git
   git push -u origin main
   ```

---

## Step 3: Deploy Backend on Render (5 minutes)

1. Go to [https://render.com](https://render.com) and sign up
2. Click **"New" → "Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `quotation-studio-api`
   - **Region:** Oregon (or closest)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm ci && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && node dist/main.js`
   - **Plan:** Free

5. Add **Environment Variables** (click "Advanced" → "Add Environment Variable"):

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your Neon connection string from Step 1 |
   | `JWT_SECRET` | Any random long string (e.g., `ks8d7f6g5h4j3k2l1-quotation-secret`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_JWT_SECRET` | Another random long string |
   | `CLIENT_JWT_EXPIRES_IN` | `24h` |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | (leave empty for now, add after Vercel deploy) |

6. Click **"Create Web Service"**
7. Wait for the build to complete (3-5 minutes)
8. Note your Render URL: `https://quotation-studio-api.onrender.com`

### Run Database Seed (one-time):
After the first successful deploy, go to Render → your service → **Shell** tab:
```bash
npx ts-node src/seed.ts
```

Or connect to Neon directly from your local machine:
```bash
cd server
DATABASE_URL="your-neon-url" npx ts-node src/seed.ts
```

---

## Step 4: Deploy Frontend on Vercel (3 minutes)

1. Go to [https://vercel.com](https://vercel.com) and sign up (GitHub login)
2. Click **"Add New" → "Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Add **Environment Variable:**

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://quotation-studio-api.onrender.com/api/v1` |

6. Click **"Deploy"**
7. Wait 1-2 minutes
8. Your app is live at: `https://your-project.vercel.app`

---

## Step 5: Connect CORS (1 minute)

Go back to Render → your backend service → **Environment** tab:

Add/update:
| Key | Value |
|-----|-------|
| `CLIENT_URL` | `https://your-project.vercel.app` |

Click **"Save Changes"** — Render will auto-redeploy.

---

## Step 6: Test It!

1. Open your Vercel URL
2. Login with: `admin@quotationstudio.com` / `admin123`
3. You should see the Dashboard
4. Try creating a quotation, adding items, publishing

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails | Check CORS — ensure `CLIENT_URL` in Render matches your Vercel URL exactly |
| Database errors | Check `DATABASE_URL` in Render — must include `?sslmode=require` |
| Build fails on Render | Make sure Root Directory is set to `server` |
| Build fails on Vercel | Make sure Root Directory is set to `client` |
| API calls fail | Check `VITE_API_URL` in Vercel — must include `/api/v1` at the end |
| Seed didn't run | Run manually via Render Shell or local machine with Neon URL |

---

## Costs

| Service | Free Tier |
|---------|-----------|
| Neon | 500MB storage, always free |
| Render | 750 hours/month free (enough for one service 24/7) |
| Vercel | Unlimited deployments on hobby plan |

**Total monthly cost: $0**

---

## Notes for Production Scale

When you outgrow free tiers:
- **Render Pro** ($7/month) — removes cold starts, better performance
- **Neon Pro** ($19/month) — more storage, branches
- **Vercel Pro** ($20/month) — team features, analytics

The app is already built for scale — you'd just upgrade plans, no code changes needed.
