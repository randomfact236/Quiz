# Code Extracts

This folder contains extracted code modules for reference and reuse.

## Analytics Module

Complete analytics system with:
- **Page**: `page/` - Admin analytics dashboard
- **Components**: `components/` - Charts, KPI cards, tabs, filters
- **Hooks**: `use-analytics.ts` - Analytics data hooks
- **Lib**: `lib/` - Session tracking utilities
- **Tracker**: `tracker.ts` - Main tracking library
- **API**: `api.ts` - API client

### Features
- 10 analytics tabs (Overview, Visitors, Content, Ecommerce, etc.)
- Real-time visitor tracking
- Journey visualization
- Conversion funnel analysis
- Export to CSV/JSON

## Media Module

Complete media library with:
- **Page**: `page/` - Admin media management

### Features
- Drag & drop upload
- Bulk operations
- Image optimization tracking
- Grid/List view modes
- Preview modal

## Usage

Copy these modules to your project and install dependencies:
```bash
npm install recharts lucide-react
```

Make sure to configure API endpoints in `api.ts`.
