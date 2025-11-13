# Deployment Checklist

Use this checklist before deploying to Netlify.

## Pre-Deployment

- [ ] Supabase project is set up and running
- [ ] Database migration has been executed (`000_complete_migration.sql`)
- [ ] Environment variables are ready:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `GEMINI_API_KEY` (optional)
  - [ ] `WATSON_API_KEY` (optional)
  - [ ] `WATSON_ENDPOINT` (optional)
- [ ] Code builds successfully locally (`npm run build`)
- [ ] All tests pass (if applicable)

## Netlify Setup

- [ ] Repository connected to Netlify
- [ ] Build settings configured (auto-detected from `netlify.toml`)
- [ ] Environment variables added in Netlify dashboard
- [ ] Custom domain configured (optional)

## Post-Deployment

- [ ] Site is accessible at Netlify URL
- [ ] Update Supabase redirect URLs with Netlify URL
- [ ] Update Google OAuth redirect URLs (if using OAuth)
- [ ] Test authentication flow
- [ ] Test adding expenses
- [ ] Test AI coach functionality
- [ ] Verify real-time sync works
- [ ] Check browser console for errors

## Monitoring

- [ ] Set up Netlify Analytics (optional)
- [ ] Monitor Supabase dashboard for usage
- [ ] Check error logs regularly

## Rollback Plan

If something goes wrong:
1. Go to Netlify dashboard → Deploys
2. Find the last working deployment
3. Click "Publish deploy" to rollback

## Support Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Deployment Guide](docs/DEPLOYMENT.md)
