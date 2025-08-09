# Database Connection Troubleshooting Guide

## Issue: ENOTFOUND db.yfdyfhwqkdmkqhxyynnd.supabase.co

This error indicates that the system cannot resolve the Supabase hostname. Here are the troubleshooting steps:

### 1. Network Connectivity Test
Test if you can reach the Supabase server:

```bash
# Test DNS resolution
nslookup db.yfdyfhwqkdmkqhxyynnd.supabase.co

# Test connectivity
telnet db.yfdyfhwqkdmkqhxyynnd.supabase.co 5432

# Alternative test with PowerShell
Test-NetConnection -ComputerName db.yfdyfhwqkdmkqhxyynnd.supabase.co -Port 5432
```

### 2. Firewall/Network Issues
- Check if your firewall is blocking port 5432
- Check if you're behind a corporate proxy
- Try connecting from a different network

### 3. Alternative Connection Methods

#### Option A: Use individual connection parameters
Add these to your `.env` file instead of DATABASE_URL:

```env
DB_HOST=db.yfdyfhwqkdmkqhxyynnd.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=pNWZlYi2SvgAUVzR
DB_SSL=true
```

#### Option B: Try different connection string format
```env
DATABASE_URL=postgres://postgres:pNWZlYi2SvgAUVzR@db.yfdyfhwqkdmkqhxyynnd.supabase.co:5432/postgres?sslmode=require
```

### 4. Supabase-Specific Troubleshooting

#### Check Supabase Dashboard:
1. Go to your Supabase dashboard
2. Navigate to Settings > Database
3. Verify the connection string is correct
4. Check if the database is paused or has any issues

#### Connection Pooling:
Supabase uses connection pooling. Try the pooled connection string if available.

### 5. Local Development Alternative

If you're having persistent connectivity issues, you can set up a local PostgreSQL database for development:

```bash
# Install PostgreSQL locally or use Docker
docker run --name math-learning-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=math_learning_app -p 5432:5432 -d postgres:15

# Update .env for local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/math_learning_app
```

### 6. Current Server Status

The API server is running and will respond to requests, but database operations will fail until the connection is resolved.

- API Base URL: http://localhost:3000/api
- Health Check: http://localhost:3000/api/health
- Swagger Docs: http://localhost:3000/api-docs

You can test non-database endpoints, but authentication and data operations will fail until the database connection is established.
