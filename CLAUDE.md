# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static web application for comparing integration services and connectors across major iPaaS (Integration Platform as a Service) platforms: Zapier, IFTTT, Power Automate, n8n, Make, Yoom, and Dify. The app provides cross-platform search functionality and filtering capabilities to help users find and compare integration services across different iPaaS platforms.

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

### Supported iPaaS Platforms
1. **Zapier** ⚡ - Popular iPaaS with extensive connector library
2. **IFTTT** 🔗 - If This Then That consumer-focused automation
3. **Power Automate** 🔄 - Microsoft's enterprise iPaaS platform
4. **n8n** 🛠️ - Open source workflow automation platform
5. **Make** 🎯 - Advanced visual iPaaS platform (formerly Integromat)
6. **Yoom** 💫 - Japanese iPaaS platform
7. **Dify** 🤖 - AI-powered automation and integration platform

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
    ├── yoom.js
    └── dify.js
```

## Key Features

1. **Integration Service Search**: Multi-keyword search across service titles, descriptions, and tags
2. **iPaaS Platform Filtering**: Filter by specific iPaaS platforms or view all
3. **Category Filtering**: 
   - All platforms (connectors available on all 7 iPaaS platforms)
   - Multiple platforms (connectors available on 2-6 platforms)
   - Unique (platform-specific connectors)
4. **Service Details**: Expandable cards showing platform-specific connector information
5. **Direct Links**: Direct links to each platform's connector/service pages
6. **Search Modes**: Title-only search vs full-text search
7. **Performance**: Web Workers for search, debounced input, virtualization for large lists
8. **Service Name Normalization**: Automatic standardization of service names across platforms

## Service Name Normalization

The application includes a comprehensive service name normalization system to handle inconsistencies across platforms:

### Files
- `public/js/serviceNameNormalizer.js`: Core normalization logic
- `public/js/normalizationTest.js`: Testing and debugging utilities

### Common Normalizations
- **X/Twitter**: All variations → "X (formerly Twitter)"
- **Microsoft Services**: Standardized to "Microsoft" prefix
- **Google Services**: Japanese names → English equivalents
- **Independent Publisher**: Removes " (Independent Publisher)" suffix
- **Deprecated Services**: Handles "[DEPRECATED]" suffix

### Testing
Use browser console commands:
```javascript
// Run comprehensive test
NormalizationTest.runNormalizationTest()

// Show all normalization rules
NormalizationTest.showNormalizationRules()

// Get platform-specific statistics
NormalizationTest.getActualPlatformStats()
```