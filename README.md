# Excel2JSON - Cyberpunk Excel Viewer

A cyberpunk-themed Excel file viewer and converter built with React, TypeScript, and Vite. Upload Excel files, search and filter data with a terminal-style interface, and export to JSON or Excel formats.

## Features

- 🎨 **Cyberpunk UI**: Dark theme with neon effects and terminal styling
- 📊 **Excel Processing**: Upload and parse .xlsx/.xls files using ExcelJS
- 🔍 **Advanced Search**: Real-time search with enhanced highlighting
- 🏷️ **Tag Filtering**: Auto-generated tags with bash-style filtering
- 📤 **Export Options**: Export filtered data to Excel or JSON
- 💾 **Local Storage**: Persist uploaded files across sessions
- 🖥️ **Terminal Interface**: Bash-style command interface for search and filters
- 🐳 **Docker Ready**: Full Docker support for development and production

## Quick Start

### Using Docker (Recommended)

#### Production
```bash
# Start the application
make up

# Or manually
docker-compose up -d

# Access at http://localhost:3000
```

#### Development
```bash
# Start development environment
make dev

# Or manually
docker-compose -f docker-compose.dev.yml up -d

# Access at http://localhost:5173
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker Commands

### Make Commands (Recommended)
```bash
make help          # Show all available commands
make build         # Build production image
make up            # Start production container
make down          # Stop production container
make logs          # View logs
make dev           # Start development environment
make dev-logs      # View development logs
make clean         # Clean up containers and images
```

### Manual Docker Commands
```bash
# Production
docker-compose build
docker-compose up -d
docker-compose down

# Development
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
```

## Technology Stack

- **Frontend**: React 19.1.0 + TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS 4.1.10 with custom cyber theme
- **UI Components**: Radix UI + shadcn/ui-style components
- **Excel Processing**: ExcelJS 4.4.0 (secure alternative to xlsx)
- **Icons**: Lucide React
- **Containerization**: Docker + Docker Compose

## Architecture

### Core Components
- **ExcelViewer.tsx**: Main application component
- **UI Components**: Reusable components in `src/components/ui/`
- **Cyber Theme**: Custom CSS with neon effects in `src/index.css`

### Key Features Implementation
- **Multi-file Processing**: Handle multiple Excel files with sheet selection
- **Search & Highlighting**: Terminal-style search with enhanced highlighting
- **Tag System**: Auto-generated filterable tags from cell content
- **Data Grouping**: Group data by column with collapsible views
- **Pagination**: 50 items per page for large datasets
- **Export Functionality**: Excel and JSON export with styling

## Security Features

- **ExcelJS**: Uses secure ExcelJS library instead of vulnerable xlsx
- **CSP Headers**: Content Security Policy in nginx configuration
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Client-side Processing**: All Excel processing happens in browser

## Development

### Environment Setup
```bash
# Clone repository
git clone git@github.com:osamusic/excel2json.git
cd excel2json

# Install dependencies
npm install

# Start development server
npm run dev
```

### Code Style
```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Docker Development
```bash
# Start development container with hot reload
make dev

# Open shell in development container
make dev-shell

# View development logs
make dev-logs
```

## Production Deployment

### Docker Production
```bash
# Build and start production container
make build
make up

# Application will be available at http://localhost:3000
```

### Manual Deployment
```bash
# Build application
npm run build

# Serve dist/ folder with any static file server
# Example with nginx, apache, or cloud hosting
```

## Configuration

### Environment Variables
- `NODE_ENV`: Set to 'production' for production builds
- `VITE_HOST`: Set to '0.0.0.0' for Docker development

### Docker Ports
- **Production**: 3000 (nginx)
- **Development**: 5173 (Vite dev server)

### Nginx Configuration
Custom nginx.conf includes:
- Gzip compression
- Security headers
- Static asset caching
- Client-side routing support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker: `make dev`
5. Build production: `make build && make up`
6. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues and questions, please create an issue in the GitHub repository.