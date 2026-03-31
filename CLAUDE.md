# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js web application for comparing integration services and connectors across major iPaaS (Integration Platform as a Service) platforms: Zapier, IFTTT, Power Automate, n8n, Make, Yoom, Dify, and Anyflow. The app provides cross-platform search functionality and filtering capabilities to help users find and compare integration services across different iPaaS platforms.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Initialize database (apply schema, seed normalization rules)
npm run db:init

# Scrape all platforms
npm run scrape

# Scrape individual platform
npm run scrape:zapier
npm run scrape:ifttt
npm run scrape:make
npm run scrape:powerautomate
npm run scrape:n8n
npm run scrape:yoom
npm run scrape:dify
npm run scrape:anyflow
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19 + Tailwind CSS v4
- **Database**: SQLite with better-sqlite3 (server-side)
- **Scraping**: Playwright

### Data Flow
```
[Scraping]
Playwright → SQLite (data/services.db)

[Frontend]
Browser → Next.js API Routes → better-sqlite3 → SQLite
```

### Frontend Structure
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 with custom CSS for glass effects
- **Database**: better-sqlite3 for server-side SQLite queries
- **API Routes**: Server-side endpoints for search, counts, platforms

### Key Components (src/components/)
- **Header**: Application header with title
- **SearchBar**: Debounced search with mode toggle (title-only / full-text)
- **CategoryFilter**: Filters by platform coverage (all/multiple/unique)
- **PlatformFilter**: Filters by specific platform (sorted by service count)
- **ServiceCard**: Expandable cards showing service details across platforms
- **ScrollTopButton**: Smooth scroll to top functionality
- **NoResults**: Empty state display

### Database Schema

#### Tables
- `raw_services` - Scraped service data (raw)
- `normalization_rules` - Service name normalization rules
- `scrape_history` - Scraping history log

#### Views
- `normalized_services` - Services with normalization applied
- `grouped_services` - Services grouped by title with platform count
- `category_counts` - Count by category (all/multiple/unique)
- `platform_counts` - Count by platform

### Supported iPaaS Platforms
1. **Zapier** - Popular iPaaS with extensive connector library
2. **IFTTT** - If This Then That consumer-focused automation
3. **Power Automate** - Microsoft's enterprise iPaaS platform
4. **n8n** - Open source workflow automation platform
5. **Make** - Advanced visual iPaaS platform (formerly Integromat)
6. **Yoom** - Japanese iPaaS platform
7. **Dify** - AI-powered automation and integration platform
8. **Anyflow** - Japanese enterprise iPaaS platform

### API Routes (src/app/api/)
- **GET /api/search**: Search services with filters (query, platform, category, searchMode, limit, offset)
- **GET /api/counts**: Category and platform counts for filters
- **GET /api/platforms**: Platform list with service counts

### Search Algorithm
- Server-side SQLite queries via better-sqlite3
- Supports multi-keyword search with AND logic
- Filters by: category (platform coverage), platform, and search terms
- Client-side debounced search (300ms) for performance
- Results limited to 2000 for display, counts calculated from full dataset

## Deployment

- **Platform**: Vercel with Next.js hosting
- **Build**: `next build` generates optimized production build
- **CI/CD**: GitHub Actions runs weekly scraping and commits updated database

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main search page
│   ├── globals.css         # Tailwind + custom styles
│   └── api/
│       ├── search/route.ts     # Search API
│       ├── counts/route.ts     # Counts API
│       └── platforms/route.ts  # Platforms API
├── components/             # React components
│   ├── Header.tsx
│   ├── SearchBar.tsx
│   ├── CategoryFilter.tsx
│   ├── PlatformFilter.tsx
│   ├── ServiceCard.tsx
│   ├── ScrollTopButton.tsx
│   └── NoResults.tsx
└── lib/
    └── db.ts               # SQLite connection

data/
└── services.db             # SQLite database (scraped data)

scripts/
├── db/
│   ├── init.ts             # Database initialization & normalization rules
│   └── schema.sql          # Table and VIEW definitions
└── scrapers/
    ├── base.ts             # Base scraper class
    ├── types.ts            # TypeScript types
    └── [platform].ts       # Platform-specific scrapers

.github/
└── workflows/
    └── scrape.yml          # Weekly scraping workflow
```

## Key Features

1. **Integration Service Search**: Multi-keyword search across service titles, descriptions, and tags
2. **iPaaS Platform Filtering**: Filter by specific iPaaS platforms (sorted by service count)
3. **Category Filtering**:
   - All platforms (connectors available on all 8 iPaaS platforms)
   - Multiple platforms (connectors available on 2+ platforms)
   - Unique (platform-specific connectors)
4. **Service Details**: Expandable cards showing platform-specific connector information
5. **Direct Links**: Direct links to each platform's connector/service pages
6. **Search Modes**: Title-only search vs full-text search
7. **Performance**: Server-side SQLite, debounced input, 2000 result limit for display
8. **Service Name Normalization**: SQLite VIEW applies normalization rules from database

## Service Name Normalization

Normalization rules are stored in the `normalization_rules` table and applied via the `normalized_services` VIEW.

### Rule Management
- Rules defined in `scripts/db/init.ts` (`NORMALIZATION_RULES` array)
- Run `npm run db:init` to apply new rules
- Use `npm run db:init -- --reset` to reset and reapply all rules

### Common Normalizations
- **X/Twitter**: All variations → "X (formerly Twitter)"
- **Microsoft Services**: Standardized to "Microsoft" prefix
- **Google Services**: Japanese names → English equivalents
- **Case normalization**: Dify lowercase names → proper case
