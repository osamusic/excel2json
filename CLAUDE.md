# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CyberSheet X is a cyberpunk-themed Neural Data Matrix processor built with React. It provides a futuristic interface for viewing, searching, filtering, and exporting Excel files with advanced data normalization capabilities. The application runs entirely client-side with no backend requirements.

## Technology Stack

- **Frontend**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5 with hot module replacement
- **Styling**: Tailwind CSS 4.1.10 with custom shadcn/ui-style components
- **UI Components**: Radix UI primitives with custom implementations
- **Excel Processing**: ExcelJS 4.4.0 (secure alternative to xlsx) for reading/writing Excel files
- **Japanese Text Processing**: TinySegmenter for advanced Japanese tokenization
- **Data Normalization**: Custom Excel normalization service with hierarchical data support
- **Containerization**: Docker + Docker Compose with nginx for production
- **Icons**: Lucide React
- **State Management**: React hooks (no external state management library)

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build locally
npm run preview
```

### Docker Development (Recommended)
```bash
# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up -d

# Start production environment
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose -f docker-compose.dev.yml logs -f

# Stop containers
docker-compose down
docker-compose -f docker-compose.dev.yml down

# Clean up containers and images
docker-compose down --rmi all --volumes --remove-orphans
docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans
```

## Application Architecture

### Core Components Structure
- **ExcelViewer.tsx**: Main application component handling file upload, data processing, and all viewer functionality
- **src/components/ui/**: Reusable UI components (button, card, input) following shadcn/ui patterns
- **src/lib/utils.ts**: Utility functions including className merging with `cn()` function
- **src/services/excel-normalizer.ts**: Advanced data normalization service for hierarchical Excel data

### Key Features Implementation
- **Multi-file Processing**: Handles multiple Excel files with sheet selection
- **Search & Filtering**: Full-text search across all data with highlighted results
- **Tag System**: Auto-generates filterable tags from cell content with Japanese language support
- **Data Grouping**: Groups data by selected column (primary key) with collapsible views
- **Pagination**: 50 items per page for large dataset handling
- **Export Options**: Excel and JSON export with filtered data
- **Local Persistence**: Uses localStorage to maintain uploaded files and selection state between sessions
- **Data Normalization**: Automatic column cleaning, hierarchical gap filling, and data quality analysis
- **Cyberpunk UI**: Neon glow effects, terminal-style interfaces, and matrix-inspired animations

### Data Flow
1. File upload via drag-and-drop or file input
2. Excel parsing using ExcelJS library
3. Optional data normalization with hierarchical structure analysis
4. Data transformation and Japanese-aware tag extraction using TinySegmenter
5. Local storage persistence with selection state
6. Real-time filtering, searching, and grouping
7. Export functionality with processed data

## Configuration Details

### Path Aliases
- `@/*` maps to `./src/*` (configured in vite.config.ts and tsconfig.json)

### Tailwind CSS
- Custom color scheme with CSS variables for theming
- Dark mode support through Tailwind's dark mode utilities
- Component-specific styling following shadcn/ui patterns

### TypeScript Configuration
- Strict mode enabled
- Project references setup for optimal build performance
- Path mapping for clean imports

## Important Implementation Notes

### Excel Processing
- Uses ExcelJS library for secure parsing of .xlsx and .xls files
- Supports multiple sheets per workbook
- Handles complex cell types (formulas, hyperlinks, rich text)
- Optional data normalization with quality analysis

### Performance Considerations
- Pagination limits rendering to 50 items per page
- useMemo and useCallback hooks prevent unnecessary re-renders
- Local storage limits may apply for very large files

### State Management Pattern
- All state managed through React hooks in ExcelViewer component
- No external state management library used
- Local storage used for persistence across sessions

### Search Implementation
- Case-insensitive search across all cell values
- Results highlighted in yellow
- Maintains search state during filtering and grouping operations

## File Upload and Processing

The application expects Excel files (.xlsx, .xls) and processes them entirely client-side. No server upload or processing occurs, making it suitable for sensitive data that shouldn't leave the user's machine.