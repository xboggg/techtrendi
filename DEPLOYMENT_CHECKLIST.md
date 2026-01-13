# TechTrendi - Pre-Deployment Security Checklist

## 🔒 Security Fixes Applied - Ready for Testing

---

## Quick Testing Guide

### 1. Test XSS Protection (Blog Article)

**Steps:**
1. Navigate to any blog article (e.g., `/blog/test-article`)
2. Check that content renders correctly
3. Verify no `<script>` tags can be injected
4. Test markdown links work properly

**Expected Result:** ✅ Content displays safely, no script execution

---

### 2. Test Rich Text Editor

**Steps:**
1. Go to admin panel (requires admin access)
2. Create a new article or review
3. Try inserting:
   - Bold/italic text
   - Links (paste a URL)
   - Images (paste an image URL)
4. Save and preview

**Expected Result:** ✅ Editor works, malicious scripts are sanitized

---

### 3. Test Search Functionality

**Steps:**
1. Use the search feature
2. Search for any term
3. Verify highlighted results display correctly
4. Check no XSS in highlighted text

**Expected Result:** ✅ Search highlights work safely

---

### 4. Test Contact Form

**Steps:**
1. Go to `/contact`
2. Fill in all fields:
   - Name: "Test User"
   - Email: "test@example.com" (try invalid email too)
   - Subject: "Test Message"
   - Category: Select any
   - Message: "Testing contact form"
3. Submit form

**Expected Result:**
- ✅ Valid email accepted
- ✅ Invalid email rejected
- ✅ Form submits successfully

---

### 5. Test Stripe Checkout (Premium)

**Steps:**
1. Go to `/premium`
2. Click "Subscribe" button
3. Verify redirects to Stripe checkout
4. Check redirect URLs are correct
5. Cancel and verify return URL

**Expected Result:** ✅ Checkout flow works correctly

---

### 6. Test CORS Protection

**Test from Browser Console:**
```javascript
// This should work (from allowed origin)
fetch('https://your-supabase-url.supabase.co/functions/v1/check-subscription', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// From disallowed origin, should be blocked
```

**Expected Result:** ✅ Only allowed origins can access functions

---

## Environment Variables Check

Before deploying to production, ensure these are set:

```env
# Supabase
VITE_SUPABASE_URL=your-production-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Stripe
STRIPE_SECRET_KEY=your-production-stripe-key
VITE_STRIPE_PUBLISHABLE_KEY=your-production-publishable-key

# Analytics (Optional)
VITE_GA_MEASUREMENT_ID=your-ga-id
```

**⚠️ IMPORTANT:** Use different keys for development and production!

---

## Deployment Steps

### Step 1: Pre-Deployment
- [ ] All tests passed
- [ ] Environment variables updated
- [ ] Build completed successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] Documentation reviewed

### Step 2: Deploy to Staging
- [ ] Deploy to staging environment
- [ ] Test all functionality in staging
- [ ] Verify security headers (check in browser DevTools > Network)
- [ ] Test forms and user flows
- [ ] Check error logging

### Step 3: Deploy to Production
- [ ] Backup current production (if applicable)
- [ ] Deploy new version
- [ ] Test immediately after deployment
- [ ] Monitor error logs for 24 hours
- [ ] Verify analytics still working

### Step 4: Post-Deployment
- [ ] Monitor user reports
- [ ] Check performance metrics
- [ ] Review security logs
- [ ] Schedule security audit
- [ ] Update team on changes

---

## Security Headers Verification

After deployment, verify headers using browser DevTools:

1. Open DevTools (F12)
2. Go to Network tab
3. Load the homepage
4. Click on the document request
5. Check Response Headers should include:

```
Content-Security-Policy: default-src 'self'; script-src 'self' ...
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

**Online Tools:**
- https://securityheaders.com/ - Check your site
- https://csp-evaluator.withgoogle.com/ - Validate CSP

---

## Allowed CORS Origins

Current configuration allows:
- `https://techtrendi.com`
- `https://www.techtrendi.com`
- `https://lovable.dev`
- `http://localhost:5173` (development)
- `http://localhost:8080` (development)

**To Update:** Edit the `ALLOWED_ORIGINS` array in:
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/check-subscription/index.ts`

---

## Rollback Plan

If issues occur after deployment:

1. **Immediate Issues:**
   - Revert to previous version
   - Check error logs for specific issues
   - Notify team

2. **Specific Feature Issues:**
   - Disable problematic feature
   - Fix and redeploy
   - Test in staging first

3. **Security Issues:**
   - Take site offline if critical
   - Fix immediately
   - Security audit before redeployment

---

## Support & Documentation

- **Security Fixes Details:** [SECURITY_FIXES.md](SECURITY_FIXES.md)
- **Completion Summary:** [SECURITY_COMPLETION_SUMMARY.md](SECURITY_COMPLETION_SUMMARY.md)
- **Security Library:** [src/lib/security.ts](src/lib/security.ts)

---

## Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for vulnerabilities
npm audit

# Update dependencies
npm update
```

---

## Contact for Issues

If you encounter any issues during deployment:

1. Check the error logs
2. Review [SECURITY_FIXES.md](SECURITY_FIXES.md) for implementation details
3. Test in isolation to identify the issue
4. Document the error and context

---

## Final Checklist

- [ ] All security fixes tested
- [ ] Build passes without errors
- [ ] Environment variables configured
- [ ] CORS origins updated for production
- [ ] Team notified of changes
- [ ] Backup plan in place
- [ ] Monitoring tools ready
- [ ] Documentation reviewed

---

**Status:** 🎯 Security hardening complete. Ready for deployment after testing.

**Last Updated:** January 11, 2026
