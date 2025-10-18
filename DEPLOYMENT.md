# QR Generator - Deployment Guide

## Quick Deploy to Vercel

### 1. Prerequisites
- GitHub account
- Vercel account
- Node.js 18+ installed locally

### 2. Deploy Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial QR generator app"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Environment Variables**
   Add these in Vercel dashboard:
   ```
   DATABASE_URL=your-database-url
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

4. **Database Setup**
   - For production, use PostgreSQL (recommended)
   - Update `DATABASE_URL` in Vercel environment variables
   - Run migrations: `npx prisma db push`

### 3. Alternative Deployment Options

#### Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

#### Netlify
- Build command: `npm run build`
- Publish directory: `.next`
- Add environment variables in Netlify dashboard

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 4. Production Checklist

- [ ] Set secure `NEXTAUTH_SECRET`
- [ ] Configure OAuth providers
- [ ] Set up production database
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure error tracking
- [ ] Set up backups

### 5. Performance Optimization

- Enable Vercel Analytics
- Use Vercel Edge Functions for API routes
- Implement caching strategies
- Optimize images and assets
- Use CDN for static assets

### 6. Security Considerations

- Use strong passwords for database
- Enable rate limiting
- Implement CSRF protection
- Regular security updates
- Monitor for vulnerabilities

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env.local
# Edit .env.local with your values

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check `DATABASE_URL` format
   - Ensure database is accessible
   - Run `npx prisma generate`

2. **Authentication Issues**
   - Verify `NEXTAUTH_SECRET` is set
   - Check OAuth provider configuration
   - Ensure callback URLs are correct

3. **Build Errors**
   - Clear `.next` folder
   - Run `npm run build` locally first
   - Check for TypeScript errors

### Support

For deployment issues:
- Check Vercel logs
- Review environment variables
- Test locally first
- Check database connectivity
