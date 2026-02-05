# AltiTeam Deployment Guide

## Overview

This document outlines deployment procedures for the AltiTeam chat client to production environments.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- pnpm (preferred) or npm
- MCP Server running (separate deployment)

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/alti_team"

# NextAuth
NEXTAUTH_SECRET="your-32-char-minimum-secret-key"
NEXTAUTH_URL="https://your-production-domain.com"

# MCP Server
MCP_SERVER_URL="http://your-mcp-server:3001"

# Optional Integrations
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### Using .env.production

Copy the template and customize:

```bash
cp .env.production .env.production.local
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main

**Configuration:** `vercel.json` is already configured for Next.js

### Option 2: Docker

```bash
# Build image
pnpm docker:build

# Run container
pnpm docker:run
```

### Option 3: Traditional Server

```bash
# Build
pnpm build

# Start production server
pnpm start
```

## MCP Server Connection

The chat client requires an MCP server to be running separately:

### Using PM2

```bash
# Start MCP server
pnpm mcp:start

# Check status
pnpm mcp:status

# View logs
pnpm mcp:logs
```

### Environment Configuration

Set `MCP_SERVER_URL` to point to your MCP server endpoint.

## Build Verification

Before deploying, verify the build:

```bash
# Type check
npx tsc --noEmit

# Lint
pnpm lint

# Build
pnpm build
```

## Health Check

The application exposes health checks at `/api/health`:

```bash
curl https://your-domain.com/api/health
```

## Troubleshooting

### Session Issues

- Ensure `NEXTAUTH_SECRET` is set correctly
- Verify `NEXTAUTH_URL` matches your domain

### Database Connection

- Confirm `DATABASE_URL` is accessible from production
- Run migrations: `npx prisma migrate deploy`

### MCP Connection Errors

- Verify MCP server is running and accessible
- Check `MCP_SERVER_URL` environment variable
