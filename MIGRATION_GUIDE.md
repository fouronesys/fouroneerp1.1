# Migration Guide - Four One Solutions ERP

## Overview
This guide provides step-by-step instructions for migrating the Four One Solutions ERP system to a new server or deploying to Railway.

## Prerequisites
- Node.js 18+ and npm installed
- PostgreSQL database
- Domain name (optional for production)
- SSL certificate (for production)

## Migration to New Server

### 1. Server Requirements
- **Minimum Requirements:**
  - 2 CPU cores
  - 4GB RAM
  - 20GB storage
  - Ubuntu 20.04+ or similar Linux distribution
- **Recommended for Production:**
  - 4+ CPU cores
  - 8GB+ RAM
  - 50GB+ SSD storage

### 2. Prepare the New Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install nginx (optional, for reverse proxy)
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2
```

### 3. Database Setup

```bash
# Create PostgreSQL user and database
sudo -u postgres psql

CREATE USER fourone_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE fourone_erp;
GRANT ALL PRIVILEGES ON DATABASE fourone_erp TO fourone_user;
\q
```

### 4. Clone and Setup Application

```bash
# Clone the repository
git clone [your-repository-url] /opt/fourone-erp
cd /opt/fourone-erp

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://fourone_user:your_secure_password@localhost:5432/fourone_erp
NODE_ENV=production
SESSION_SECRET=$(openssl rand -base64 32)
PORT=5000
EOF
```

### 5. Build and Run

```bash
# Build the application
npm run build

# Run database migrations
npm run db:push

# Start with PM2
pm2 start npm --name "fourone-erp" -- start
pm2 save
pm2 startup
```

### 6. Configure Nginx (Optional)

```nginx
# /etc/nginx/sites-available/fourone-erp
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/fourone-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Railway Deployment

### 1. Prepare Your Repository

Ensure your repository has these files:

**package.json** - Ensure it has the correct start script:
```json
{
  "scripts": {
    "start": "NODE_ENV=production node server/index.js",
    "build": "npm run build:client",
    "build:client": "vite build"
  }
}
```

**railway.json** (already exists):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Deploy to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Initialize project
   railway init
   ```

3. **Add PostgreSQL Database**
   - In Railway dashboard, click "New Service"
   - Select "PostgreSQL"
   - Railway will automatically set DATABASE_URL

4. **Configure Environment Variables**
   ```bash
   # Set environment variables
   railway variables set NODE_ENV=production
   railway variables set SESSION_SECRET=$(openssl rand -base64 32)
   railway variables set PORT=5000
   ```

5. **Deploy**
   ```bash
   # Deploy to Railway
   railway up
   ```

6. **Custom Domain (Optional)**
   - Go to your service settings in Railway
   - Add your custom domain
   - Update DNS records as instructed

## Data Migration

### Export Data from Current System

```bash
# Export database
pg_dump -h localhost -U postgres -d fourone_erp > fourone_backup.sql

# Export uploaded files
tar -czf uploads_backup.tar.gz uploads/
```

### Import Data to New System

```bash
# Import database
psql -h localhost -U fourone_user -d fourone_erp < fourone_backup.sql

# Import uploaded files
tar -xzf uploads_backup.tar.gz
```

## Environment Variables

Complete list of environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
PGHOST=localhost
PGPORT=5432
PGUSER=fourone_user
PGPASSWORD=your_password
PGDATABASE=fourone_erp

# Application
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-session-secret

# Email (Optional)
BREVO_API_KEY=your-brevo-api-key

# AI Features (Optional)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Payment Processing (Optional)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
```

## Post-Migration Checklist

- [ ] Test user authentication
- [ ] Verify database connections
- [ ] Check file uploads work correctly
- [ ] Test email notifications
- [ ] Verify DGII integrations
- [ ] Test POS functionality
- [ ] Check report generation
- [ ] Verify payment processing
- [ ] Test all API endpoints
- [ ] Monitor error logs

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check PostgreSQL is running
   - Verify firewall rules

2. **Build Failures**
   - Ensure Node.js version matches
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

3. **Session Issues**
   - Verify SESSION_SECRET is set
   - Check cookie settings for HTTPS

4. **File Upload Issues**
   - Verify upload directory permissions
   - Check disk space

## Support

For additional help:
- Check application logs: `pm2 logs fourone-erp`
- Database logs: `/var/log/postgresql/`
- Nginx logs: `/var/log/nginx/`