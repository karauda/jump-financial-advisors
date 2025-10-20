# ⚠️ IMPORTANT: pgvector on Render

## PostgreSQL Configuration

Render's native PostgreSQL **does support pgvector**, but you need to ensure it's available:

### Option 1: pgvector is Pre-installed (Render Standard)
Most Render PostgreSQL 16 instances have pgvector pre-installed. Your migration will enable it automatically:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Option 2: If pgvector is Missing
If you get an error about pgvector not being available, you have two options:

**A. Contact Render Support**
- Request pgvector extension for your PostgreSQL instance
- Usually enabled within hours

**B. Use Alternative Deployment**
Instead of Render Blueprint, create services manually:
1. Create PostgreSQL database (ensure pgvector support)
2. Create Redis instance
3. Create Backend web service
4. Create Frontend static site

## Migration Command

After deployment, run in backend shell:
```bash
npm run migrate
```

If you see:
```
✓ pgvector extension enabled
✓ Users table created
...
✅ Database migration completed successfully!
```

**Then pgvector is working!** ✅

If you see an error about pgvector not available, contact Render support.

## Cost Note

- **Database (starter)**: $7/month
- **Redis (starter)**: $7/month  
- **Backend web (free)**: $0/month (spins down after 15 min)
- **Frontend (free)**: $0/month
- **Total**: $14/month

Render offers 90-day trial credit for new accounts!

---

**Your render.yaml is now configured correctly.** 🎉

