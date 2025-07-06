# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static web application that compares services across multiple automation platforms (Zapier, IFTTT, Power Automate, n8n, Make, Yoom). The app provides search functionality and filtering capabilities to help users find and compare services across different platforms.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build (no build needed for static site)
npm run build

# Deploy to production
npm run start
```

## Architecture

### Frontend Structure
- **Single Page Application**: Built with React (CDN version) + Babel for JSX transformation
- **Styling**: Tailwind CSS (CDN) with custom CSS for glass effects and animations
- **Search**: Web Workers for performance optimization of search operations
- **Data**: Static JavaScript files in `public/platforms/` containing service definitions

### Key Components
- **SearchBar**: Debounced search with suggestion support
- **CategoryButton**: Filters services by platform coverage (all/multiple/unique)
- **PlatformButton**: Filters services by specific platform
- **ServiceCard**: Expandable cards showing service details across platforms
- **ScrollTopButton**: Smooth scroll to top functionality

### Data Structure
Each platform's services are defined in `public/platforms/[platform].js` files:
```javascript
const platformServices = [
  {
    title: "Service Name",
    description: "Service description",
    tag: "Optional tag",
    icon: "Icon URL",
    link: "Service URL"
  }
];
```

### Search Algorithm
- Uses Web Workers for non-blocking search operations
- Supports multi-keyword search with AND logic
- Filters by: category (platform coverage), platform, and search terms
- Implements debounced search (300ms) for performance

## Deployment

- **Platform**: Vercel with static site hosting
- **Configuration**: `vercel.json` handles routing and security headers
- **Domain**: All routes redirect to `index.html` for SPA behavior

## File Structure

```
public/
├── index.html          # Main application file
├── js/ga.js           # Google Analytics setup
└── platforms/         # Platform data files
    ├── zapier.js
    ├── ifttt.js
    ├── powerAutomate.js
    ├── n8n.js
    ├── make.js
    └── yoom.js
```

## Key Features

1. **Service Search**: Multi-keyword search across titles, descriptions, and tags
2. **Platform Filtering**: Filter by specific platforms or view all
3. **Category Filtering**: 
   - All platforms (services available on all 5 platforms)
   - Multiple platforms (2-4 platforms)
   - Unique (platform-specific services)
4. **Service Details**: Expandable cards showing platform-specific information
5. **External Links**: Direct links to platform pages and Google search
6. **Performance**: Web Workers for search, debounced input, virtualization for large lists