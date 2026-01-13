# FASTEST WAY TO PUBLISH - 3 Simple Options

## The Issue
Your self-hosted Supabase has a JWT configuration mismatch. The API keys work for the frontend but not for Node.js scripts.

## ✅ SOLUTION 1: Direct Database Access (2 MINUTES)

Since Supabase is on your Contabo server, you can access PostgreSQL directly:

### SSH into your server and run:

```bash
# SSH into Contabo server
ssh root@38.242.195.0

# Access PostgreSQL database
docker exec -it supabase-db psql -U postgres -d postgres

# Now you're in PostgreSQL - ready to insert articles!
```

### Copy-paste this SQL (I'll create the full file):

See `scripts/DIRECT_SQL_INSERT.sql` - Run this in the PostgreSQL terminal

---

## ✅ SOLUTION 2: Supabase Studio Table Editor (10 MINUTES)

This is the most reliable method:

1. Open https://studio.techtrendi.com
2. Login: admin / 0dyEV4XW5NtKm1iO
3. Click **Table Editor** → **articles**
4. For each article, click **Insert Row**
5. Copy data from `MANUAL_PUBLISHING_GUIDE.md`

---

## ✅ SOLUTION 3: Fix the JWT and Use Script (15 MINUTES)

The JWT secret in your Supabase `.env` needs to match the keys.

### On your Contabo server:

```bash
# Find Supabase directory
cd /path/to/supabase

# Check JWT secret
cat .env | grep JWT_SECRET

# Generate new keys with that secret using:
# https://supabase.com/docs/guides/self-hosting#api-keys
```

---

## 🎯 MY RECOMMENDATION: Use Solution 1 (Direct PostgreSQL)

This bypasses all API/JWT issues and inserts directly into the database.

### I'm creating the SQL file now with all 10 articles...

File: `scripts/DIRECT_SQL_INSERT.sql`

### How to use it:

1. SSH into your server
2. Copy the SQL file to server
3. Run: `docker exec -it supabase-db psql -U postgres -d postgres -f DIRECT_SQL_INSERT.sql`
4. Done! All 10 articles published.

---

## ⏰ Time Estimates:

- **Direct SQL (Solution 1):** 2-5 minutes
- **Manual Table Editor (Solution 2):** 10-50 minutes
- **Fix JWT (Solution 3):** 15-30 minutes

**Choose Solution 1 for fastest results!**

I'm preparing the SQL file now...
