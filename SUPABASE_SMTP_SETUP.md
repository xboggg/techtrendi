# Supabase SMTP Configuration Guide

## Issue:
"Error sending confirmation email" when users sign up

## Solution:
Configure SMTP in your self-hosted Supabase instance at db.techtrendi.com

---

## Step 1: Access Supabase Configuration

Your Supabase is self-hosted, so you need to update the environment variables. This is typically done in one of these places:

### Option A: Docker Compose (Most Common)
If you're running Supabase via Docker, find your `docker-compose.yml` or `.env` file.

### Option B: Kubernetes/Server Config
If using k8s or direct installation, find your config file.

---

## Step 2: Add SMTP Environment Variables

Add these variables to your Supabase configuration:

```env
# SMTP Configuration for Email
SMTP_ADMIN_EMAIL=noreply@techtrendi.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@techtrendi.com
SMTP_PASS=your-app-password-here
SMTP_SENDER_NAME=TechTrendi

# Supabase Auth Settings
SITE_URL=https://techtrendi.com
MAILER_URLPATHS_CONFIRMATION=/auth/confirm
MAILER_URLPATHS_INVITE=/auth/invite
MAILER_URLPATHS_RECOVERY=/auth/reset-password
MAILER_URLPATHS_EMAIL_CHANGE=/auth/email-change
```

---

## Step 3: Gmail App Password Setup

Since you're using `info@techtrendi.com` (likely Gmail), you need an **App Password**:

1. **Go to Google Account**: https://myaccount.google.com/
2. **Enable 2-Step Verification** (required for app passwords)
   - Security → 2-Step Verification → Turn On
3. **Create App Password**:
   - Security → 2-Step Verification → App Passwords
   - Select "Mail" and "Other (Custom name)" → Enter "Supabase"
   - Click "Generate"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
4. **Use in config**: Remove spaces, use as `SMTP_PASS=abcdefghijklmnop`

---

## Step 4: Alternative - Use Custom Domain Email

If `info@techtrendi.com` is hosted elsewhere (not Gmail), use those SMTP settings:

### For Namecheap Email:
```env
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=info@techtrendi.com
SMTP_PASS=your-email-password
```

### For cPanel/WHM Email:
```env
SMTP_HOST=mail.techtrendi.com
SMTP_PORT=587
SMTP_USER=info@techtrendi.com
SMTP_PASS=your-email-password
```

### For Office 365:
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=info@techtrendi.com
SMTP_PASS=your-email-password
```

---

## Step 5: Restart Supabase Services

After updating the configuration:

### Docker:
```bash
docker-compose down
docker-compose up -d
```

### Kubernetes:
```bash
kubectl rollout restart deployment/supabase-auth
```

---

## Step 6: Test Email Sending

### Via Supabase Dashboard:
1. Go to https://db.techtrendi.com
2. Authentication → Email Templates
3. Click "Send Test Email"
4. Check if email arrives at your inbox

### Via Sign Up:
1. Go to https://techtrendi.com/auth
2. Try signing up with a test email
3. Check email inbox for confirmation link

---

## Email Templates Customization (Optional)

You can customize email templates in Supabase Dashboard:

**Authentication → Email Templates**

Available templates:
- Confirm signup
- Invite user
- Magic link
- Change email address
- Reset password

Customize with your branding and style.

---

## Troubleshooting

### Error: "Authentication failed"
- Check SMTP_USER and SMTP_PASS are correct
- For Gmail, ensure you're using App Password (not regular password)
- Verify 2-Step Verification is enabled

### Error: "Connection timeout"
- Check SMTP_HOST is correct
- Try port 465 instead of 587 (SSL vs TLS)
- Check firewall allows outbound connections on port 587/465

### Error: "Relay access denied"
- SMTP_USER must match the "from" address
- Some SMTP servers require authentication

### Still not working?
Run this SQL to check Supabase auth config:
```sql
SELECT * FROM auth.config;
```

Look for `mailer_*` settings to verify they're set correctly.

---

## Security Notes

- **Never commit SMTP passwords to git**
- Use environment variables or secrets management
- Rotate SMTP passwords regularly
- Use App Passwords instead of main account passwords
- Enable 2FA on email accounts

---

## After SMTP is Working

Once emails are sending:

1. **Test full signup flow**:
   - Sign up with test email
   - Receive confirmation email
   - Click confirmation link
   - Verify account is active

2. **Test password reset**:
   - Go to login page
   - Click "Forgot password"
   - Enter email
   - Receive reset email
   - Reset password successfully

3. **Monitor email delivery**:
   - Check Supabase logs for email errors
   - Monitor Gmail/SMTP quota limits
   - Set up email delivery monitoring

---

## Quick Reference

**Current Setup:**
- Supabase: https://db.techtrendi.com
- Website: https://techtrendi.com
- Email: info@techtrendi.com

**Required Variables:**
```
SMTP_ADMIN_EMAIL=noreply@techtrendi.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@techtrendi.com
SMTP_PASS=<app-password>
SITE_URL=https://techtrendi.com
```

**After configuration:**
1. Restart Supabase
2. Test signup
3. Check email delivery
4. Update email templates
