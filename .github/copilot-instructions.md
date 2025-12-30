# Copilot Instructions for NLP_PROJECT

## Project Overview
This is a **general-purpose plant disease detection dashboard** built with Next.js 16 (App Router) and TypeScript. The application processes leaf images through AI models (V1 for classification, V2+A1 for segmentation) to detect plant diseases across any crop type, calculate severity scores, and provide agronomic recommendations.

> **Note**: The system is designed for general plant disease detection, not specialized for specific crops.

## Architecture

### Frontend Structure
- **Single-page application**: All components render on `/` (main dashboard at [app/page.tsx](frontend/app/page.tsx))
- **Component hierarchy**: 
  - `DashboardContent` orchestrates state (`analyzed`, `isAnalyzing`)
  - Child panels: `AnalysisPanel`, `ClassificationPanel`, `SegmentationPanel`, `RecommendationPanel`
  - All panels are client-side rendered (`"use client"` directive)

### State Management
- No global state library - uses React `useState` in parent component ([app/page.tsx](frontend/app/page.tsx))
- State flows from `DashboardContent` → child panels via props
- Simulated async analysis: 2-second timeout in `startAnalysis()` function

### UI Components
- **shadcn/ui** library configured with "new-york" style (see [components.json](frontend/components.json))
- All UI primitives in [components/ui/](frontend/components/ui/)
- Uses **Radix UI** primitives under the hood
- Charts via **Recharts** library ([classification-panel.tsx](frontend/components/classification-panel.tsx), [recommendation-panel.tsx](frontend/components/recommendation-panel.tsx))

## Development Conventions

### Component Patterns
1. **Client components required**: All interactive components need `"use client"` at top of file
2. **Styling**: Use Tailwind CSS classes with `cn()` utility ([lib/utils.ts](frontend/lib/utils.ts)) for conditional classes
3. **Icons**: Use `lucide-react` library (e.g., `<Camera />`, `<Activity />`)
4. **CSS variables**: Color system uses CSS variables (e.g., `var(--color-primary)`, `var(--color-border)`)

### TypeScript Configuration
- Path alias `@/*` resolves to project root ([tsconfig.json](frontend/tsconfig.json))
- Import UI components: `@/components/ui/card`
- Import utilities: `@/lib/utils`

### Data Visualization
- **BarChart** for confidence scores (horizontal bars in [classification-panel.tsx](frontend/components/classification-panel.tsx))
- **LineChart** for severity trends (time series in [recommendation-panel.tsx](frontend/components/recommendation-panel.tsx))
- Use `ResponsiveContainer` to ensure charts scale with parent

### Mock Data Pattern
Current implementation uses **hardcoded mock data** for:
- Segmentation results (lesion count, infected surface percentage)
- Severity history trends

**Real API integration exists for**:
- Disease classification via `/predict_base64` endpoint (see [lib/api.ts](frontend/lib/api.ts))

## Backend API Integration

### Classification API
The app connects to a FastAPI backend for disease classification:

```typescript
// API endpoints (lib/api.ts)
/health          - GET  - Health check
/predict         - POST - Multipart form-data file upload
/predict_base64  - POST - JSON with base64-encoded image
```

**Configuration**: Set `NEXT_PUBLIC_API_URL` in `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app
```

**API Response Format**:
```typescript
interface ClassificationResult {
  predicted_class: string      // e.g., "Cassava_Bacterial_Blight"
  predicted_label: string      // e.g., "Cassava Bacterial Blight"
  top_3: Array<{
    class: string
    label: string
    score: number              // 0.0 - 1.0
  }>
}
```

**Note**: ngrok URLs change frequently - update `.env.local` when the backend URL changes.

## Developer Workflow

### Commands
```bash
# From frontend/ directory
pnpm install      # Install dependencies
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Run production server
pnpm lint         # Run ESLint
```

### Package Manager
**Always use `pnpm`** (not npm/yarn) - lockfile is [pnpm-lock.yaml](frontend/pnpm-lock.yaml)

### Build Configuration
- TypeScript errors ignored during build (`ignoreBuildErrors: true` in [next.config.mjs](frontend/next.config.mjs))
- Image optimization disabled (`unoptimized: true`)
- Vercel Analytics included in production ([app/layout.tsx](frontend/app/layout.tsx))

## Key Files to Modify

| Task | Primary Files |
|------|---------------|
| Add new panel | Create in `components/`, import to `app/page.tsx` |
| Update state logic | Modify `DashboardContent` in `app/page.tsx` |
| Add UI components | Run `pnpm dlx shadcn@latest add <component>` (auto-updates `components/ui/`) |
| Style changes | Edit Tailwind classes directly, or `app/globals.css` for global styles |
| API integration | Replace mock data arrays in panel components, add `fetch` in `startAnalysis()` |

## Important Notes
- **No backend currently exists** - all data is mocked in frontend
- Disease model names (V1, V2+A1) are placeholders - update when actual models integrated
- Image upload is non-functional (placeholder only) - needs file upload handler
- Theme system configured but not actively used - dark/light mode UI exists via `next-themes`
