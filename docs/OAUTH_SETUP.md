# Google OAuth Configuration Guide

This guide walks you through setting up Google OAuth authentication for FinSmart using Supabase.

## Prerequisites

- A Supabase project (already created)
- A Google Cloud Platform account
- Access to your Supabase dashboard

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the required fields:
     - App name: `FinSmart`
     - User support email: Your email
     - Developer contact email: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if needed (for development)
   - Save and continue

6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `FinSmart Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
     - Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference

7. Click **Create** and save your:
   - Client ID
   - Client Secret

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list of providers
5. Enable the Google provider
6. Enter your Google OAuth credentials:
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console
7. Copy the **Callback URL** shown in Supabase (format: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`)
8. Click **Save**

## Step 3: Update Google Cloud Console Redirect URIs

1. Return to Google Cloud Console > **APIs & Services** > **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, ensure you have:
   - The Supabase callback URL from Step 2
   - Format: `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
4. Click **Save**

## Step 4: Test OAuth Flow

### Development Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login` or `http://localhost:3000/signup`

3. Click the **Sign in with Google** or **Sign up with Google** button

4. You should be redirected to Google's OAuth consent screen

5. After granting permissions, you'll be redirected back to your app at `/auth/callback`

6. The callback page will:
   - Establish your session
   - Seed initial data for new users (categories and sample transactions)
   - Redirect you to the dashboard

### Expected Flow

```
User clicks "Sign in with Google"
  ↓
Redirect to Google OAuth consent screen
  ↓
User grants permissions
  ↓
Redirect to Supabase callback URL
  ↓
Supabase processes OAuth response
  ↓
Redirect to /auth/callback in your app
  ↓
App establishes session and seeds data
  ↓
Redirect to dashboard (/)
```

## Step 5: Production Deployment

### Update Environment Variables

Ensure your production environment has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Update Google OAuth Settings

1. In Google Cloud Console, add your production domain to:
   - **Authorized JavaScript origins**: `https://your-production-domain.com`
   - **Authorized redirect URIs**: Keep the Supabase callback URL

2. If using a custom domain with Supabase, update the redirect URI accordingly

### Verify OAuth Consent Screen

1. In Google Cloud Console, go to **OAuth consent screen**
2. For production, you may need to:
   - Submit your app for verification (if requesting sensitive scopes)
   - Add your production domain to authorized domains
   - Update privacy policy and terms of service URLs

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in your request doesn't match any authorized redirect URIs in Google Cloud Console.

**Solution**:
1. Check the exact callback URL in Supabase dashboard
2. Ensure it's added to Google Cloud Console > Credentials > Authorized redirect URIs
3. Make sure there are no trailing slashes or typos

### Error: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen is not properly configured.

**Solution**:
1. Complete all required fields in the OAuth consent screen
2. Add test users if the app is in testing mode
3. Ensure the app is published if you want public access

### Error: "Authentication failed" on callback page

**Cause**: Session could not be established after OAuth redirect.

**Solution**:
1. Check browser console for detailed error messages
2. Verify Supabase credentials are correct in `.env.local`
3. Ensure cookies are enabled in the browser
4. Check Supabase dashboard logs for authentication errors

### OAuth works but no data appears

**Cause**: Data seeding may have failed.

**Solution**:
1. Check browser console for seeding errors
2. Verify database tables exist and RLS policies are correct
3. Check Supabase dashboard logs for database errors
4. The user can still use the app; they'll just need to create categories manually

### Error: "Network error" during OAuth

**Cause**: Network connectivity issues or CORS problems.

**Solution**:
1. Check your internet connection
2. Verify Supabase project is active and not paused
3. Check browser network tab for failed requests
4. Ensure your domain is in the allowed list in Supabase settings

## Security Best Practices

1. **Never commit OAuth credentials**: Keep Client ID and Client Secret in environment variables
2. **Use HTTPS in production**: OAuth requires secure connections
3. **Restrict authorized domains**: Only add domains you control
4. **Monitor OAuth usage**: Check Google Cloud Console for unusual activity
5. **Rotate secrets periodically**: Update Client Secret every 6-12 months
6. **Limit OAuth scopes**: Only request the minimum scopes needed (email, profile)

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase OAuth Providers Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

## Support

If you encounter issues not covered in this guide:

1. Check Supabase dashboard logs: **Authentication** > **Logs**
2. Check Google Cloud Console logs: **APIs & Services** > **Credentials**
3. Review browser console for client-side errors
4. Contact Supabase support or check their Discord community
