# Environment Configuration Guide

This guide explains all environment variables required for FinSmart and how to obtain them.

## Required Environment Variables

### Supabase Configuration (Required)

These variables are **required** for the application to function:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**How to get these:**

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project (or use an existing one)
3. Navigate to **Settings** → **API** in your project dashboard
4. Copy the following:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon/public** key → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Security Notes:**
- The `NEXT_PUBLIC_` prefix means these variables are exposed to the browser
- The anon key is safe to expose because Row Level Security (RLS) protects your data
- Never expose the `service_role` key in client-side code

## Optional Environment Variables

### AI Services (Optional)

These variables enable AI-powered features like the financial coach and smart expense extraction:

```env
GEMINI_API_KEY=your_gemini_api_key_here
WATSON_API_KEY=your_watson_api_key_here
WATSON_ENDPOINT=your_watson_endpoint_here
```

**Gemini API (Google AI):**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and use as `GEMINI_API_KEY`

**Watson AI (IBM):**
1. Go to [IBM Cloud](https://cloud.ibm.com/)
2. Create an account or sign in
3. Create a Watson Assistant or Watson Discovery service
4. Get your API key and endpoint from the service credentials
5. Use as `WATSON_API_KEY` and `WATSON_ENDPOINT`

**What happens without AI keys:**
- The app will still work for core financial tracking features
- AI coach chat will not be available
- Smart expense extraction from natural language will not work
- You can add these keys later to enable AI features

### Google OAuth (Optional)

Google OAuth is configured entirely through the Supabase dashboard and Google Cloud Console. **No environment variables are needed** for OAuth functionality.

To enable Google Sign-In:
1. Follow the detailed guide in [docs/OAUTH_SETUP.md](./OAUTH_SETUP.md)
2. Configure OAuth credentials in Google Cloud Console
3. Enable Google provider in Supabase Dashboard
4. No changes to `.env.local` required

## Environment File Setup

### Development Environment

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and replace placeholder values with your actual credentials

3. The `.env.local` file is gitignored and will not be committed to version control

### Production Environment

For production deployment (Vercel, Netlify, etc.):

1. Add environment variables in your hosting platform's dashboard
2. Use the same variable names as in `.env.local`
3. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
4. AI service keys are optional but recommended for full functionality

**Vercel Example:**
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each variable with its value
4. Redeploy your application

## Verifying Your Configuration

### Check Supabase Connection

Run the test script to verify your Supabase configuration:

```bash
npx ts-node scripts/test-supabase.ts
```

This will test:
- Database connection
- Authentication
- Table access
- RLS policies

### Check OAuth Configuration

If you've set up Google OAuth, test it by:

```bash
npx ts-node scripts/test-oauth.ts
```

Or manually:
1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Complete the OAuth flow

### Check AI Services

Start the development server and test AI features:
- Open the chat panel and send a message (tests Watson/Gemini)
- Try the smart expense recorder (tests AI expense extraction)

## Common Issues

### "Invalid API key" or "Unauthorized"

**Supabase:**
- Verify you copied the correct anon key (not the service role key)
- Check for extra spaces or line breaks in the key
- Ensure the project URL matches your Supabase project

**AI Services:**
- Verify API keys are active and not expired
- Check for correct formatting (no extra spaces)
- Ensure you have sufficient quota/credits

### "Cannot connect to database"

- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that your Supabase project is active (not paused)
- Ensure you have internet connectivity
- Check Supabase status page for outages

### Environment variables not loading

- Ensure the file is named exactly `.env.local` (not `.env.local.txt`)
- Restart your development server after changing environment variables
- Check that the file is in the root directory of your project
- Verify the file is not empty and has proper formatting

### OAuth not working

- OAuth configuration is separate from environment variables
- See [docs/OAUTH_SETUP.md](./OAUTH_SETUP.md) for complete setup
- See [docs/OAUTH_TROUBLESHOOTING.md](./OAUTH_TROUBLESHOOTING.md) for common issues

## Security Best Practices

1. **Never commit `.env.local`**: It's gitignored by default, keep it that way
2. **Don't share credentials**: Each developer should have their own Supabase project for development
3. **Use separate projects**: Have different Supabase projects for development and production
4. **Rotate keys periodically**: Update API keys every 6-12 months
5. **Monitor usage**: Check Supabase and AI service dashboards for unusual activity
6. **Use environment-specific keys**: Don't use production keys in development

## Environment Variables Reference

| Variable | Required | Purpose | Where to Get |
|----------|----------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase public API key | Supabase Dashboard → Settings → API |
| `GEMINI_API_KEY` | ❌ No | Google AI for chat | Google AI Studio |
| `WATSON_API_KEY` | ❌ No | IBM Watson AI | IBM Cloud |
| `WATSON_ENDPOINT` | ❌ No | Watson service endpoint | IBM Cloud |

## Next Steps

After configuring your environment:

1. ✅ Run database migrations (see [README.md](../README.md))
2. ✅ Start the development server: `npm run dev`
3. ✅ Create an account and test the application
4. ✅ (Optional) Configure Google OAuth (see [docs/OAUTH_SETUP.md](./OAUTH_SETUP.md))

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Google AI Studio](https://makersuite.google.com/)
- [IBM Watson Documentation](https://cloud.ibm.com/docs/watson)
