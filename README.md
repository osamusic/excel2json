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
docker-compose up -d

# Access at http://localhost:8080
```

#### Development
```bash
# Start development environment
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

### Production Commands
```bash
# Build and start production container
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f

# Stop container
docker-compose down

# Restart container
docker-compose restart

# Remove containers and images
docker-compose down --rmi all --volumes --remove-orphans
```

### Development Commands
```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up -d

# View development logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down

# Open shell in development container
docker-compose -f docker-compose.dev.yml exec excel2json-dev sh

# Remove development containers and images
docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans
```

### Utility Commands
```bash
# View container status
docker ps -a --filter "label=com.docker.compose.project=excel2json"

# Clean up Docker system
docker system prune -f
docker volume prune -f
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
docker-compose -f docker-compose.dev.yml up -d

# Open shell in development container
docker-compose -f docker-compose.dev.yml exec excel2json-dev sh

# View development logs
docker-compose -f docker-compose.dev.yml logs -f
```

## Production Deployment

### Docker Production
```bash
# Build and start production container
docker-compose build
docker-compose up -d

# Application will be available at http://localhost:8080
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
- **Production**: 8080 (nginx)
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
4. Test with Docker: `docker-compose -f docker-compose.dev.yml up -d`
5. Build production: `docker-compose build && docker-compose up -d`
6. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues and questions, please create an issue in the GitHub repository.