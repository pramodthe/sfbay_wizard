# OAuth Troubleshooting Quick Reference

## Common Error Messages and Solutions

### "redirect_uri_mismatch"

**What it means**: The callback URL doesn't match what's configured in Google Cloud Console.

**How to fix**:
1. Go to Supabase Dashboard → Settings → API
2. Copy your project URL (e.g., `https://xxxxx.supabase.co`)
3. The callback URL should be: `https://xxxxx.supabase.co/auth/v1/callback`
4. Add this exact URL to Google Cloud Console → Credentials → Authorized redirect URIs
5. Make sure there are no trailing slashes or typos

### "Access blocked: This app's request is invalid"

**What it means**: OAuth consent screen is not properly configured.

**How to fix**:
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Complete all required fields (App name, User support email, Developer contact)
3. Add test users if the app is in "Testing" mode
4. Publish the app if you want public access

### "Authentication failed" on callback page

**What it means**: Session could not be established after OAuth redirect.

**How to fix**:
1. Check browser console for detailed errors
2. Verify `.env.local` has correct Supabase credentials
3. Ensure cookies are enabled in your browser
4. Try clearing browser cache and cookies
5. Check Supabase Dashboard → Authentication → Logs for errors

### "Failed to sign in with Google" on login page

**What it means**: OAuth initiation failed.

**How to fix**:
1. Verify Google OAuth is enabled in Supabase Dashboard → Authentication → Providers
2. Check that Client ID and Client Secret are correctly entered in Supabase
3. Ensure your Supabase project is not paused
4. Check browser console for network errors

### OAuth works but no data appears

**What it means**: Data seeding failed after successful authentication.

**How to fix**:
1. Check browser console for seeding errors
2. Verify database tables exist (run migrations if needed)
3. Check Row Level Security policies are correct
4. User can manually create categories as a workaround

### "Network error" during OAuth

**What it means**: Connection issues between browser, Supabase, or Google.

**How to fix**:
1. Check your internet connection
2. Verify Supabase project is active (not paused)
3. Check if Google services are accessible
4. Try disabling VPN or proxy temporarily
5. Check browser network tab for failed requests

## Quick Checklist

Before testing OAuth, verify:

- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] OAuth consent screen configured in Google Cloud Console
- [ ] Google provider enabled in Supabase Dashboard
- [ ] Client ID and Client Secret added to Supabase
- [ ] Correct callback URL added to Google Cloud Console
- [ ] Environment variables set in `.env.local`
- [ ] Database migrations run successfully
- [ ] Cookies enabled in browser
- [ ] No ad blockers interfering with redirects

## Testing OAuth Flow

### Manual Test Steps

1. Open browser in incognito/private mode (to avoid cached sessions)
2. Navigate to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Should redirect to Google consent screen
5. Grant permissions
6. Should redirect back to your app
7. Should see loading screen at `/auth/callback`
8. Should redirect to dashboard with data loaded

### Expected Console Output

When OAuth succeeds, you should see:
```
User data seeded successfully
```

When OAuth fails, you'll see error messages like:
```
Error establishing session: [error details]
```

## Debugging Tools

### Browser Console

Open Developer Tools (F12) and check:
- Console tab for JavaScript errors
- Network tab for failed requests
- Application tab → Cookies to verify session cookies

### Supabase Dashboard

Check these sections:
- Authentication → Users (verify user was created)
- Authentication → Logs (see authentication events)
- Database → Table Editor (verify data was seeded)
- Logs → API Logs (see all API requests)

### Google Cloud Console

Check these sections:
- APIs & Services → Credentials (verify OAuth client)
- APIs & Services → OAuth consent screen (verify configuration)
- Logs Explorer (see OAuth requests and errors)

## Getting Help

If you're still stuck:

1. Check the full setup guide: `docs/OAUTH_SETUP.md`
2. Review Supabase Auth documentation: https://supabase.com/docs/guides/auth
3. Check Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
4. Search Supabase Discord: https://discord.supabase.com
5. Check GitHub issues for similar problems

## Test Script

Run the OAuth configuration test:

```bash
npx ts-node scripts/test-oauth.ts
```

This will verify:
- Supabase connection
- Environment variables
- Callback URL format
- Configuration checklist
