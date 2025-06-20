# Excel2JSON Docker Commands

.PHONY: help build up down logs clean dev dev-up dev-down dev-logs

# Default target
help:
	@echo "Excel2JSON Docker Commands:"
	@echo ""
	@echo "Production Commands:"
	@echo "  build       Build the production Docker image"
	@echo "  up          Start the production container"
	@echo "  down        Stop the production container"
	@echo "  logs        View production container logs"
	@echo "  restart     Restart the production container"
	@echo ""
	@echo "Development Commands:"
	@echo "  dev         Build and start development environment"
	@echo "  dev-up      Start development container"
	@echo "  dev-down    Stop development container"
	@echo "  dev-logs    View development container logs"
	@echo "  dev-shell   Open shell in development container"
	@echo ""
	@echo "Utility Commands:"
	@echo "  clean       Remove all containers and images"
	@echo "  prune       Clean up Docker system"
	@echo "  status      Show container status"

# Production commands
build:
	@echo "Building production image..."
	docker-compose build

up:
	@echo "Starting production container..."
	docker-compose up -d
	@echo "Application available at http://localhost:3000"

down:
	@echo "Stopping production container..."
	docker-compose down

logs:
	@echo "Showing production logs..."
	docker-compose logs -f

restart:
	@echo "Restarting production container..."
	docker-compose restart

# Development commands
dev: dev-build dev-up

dev-build:
	@echo "Building development image..."
	docker-compose -f docker-compose.dev.yml build

dev-up:
	@echo "Starting development container..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development server available at http://localhost:5173"

dev-down:
	@echo "Stopping development container..."
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	@echo "Showing development logs..."
	docker-compose -f docker-compose.dev.yml logs -f

dev-shell:
	@echo "Opening shell in development container..."
	docker-compose -f docker-compose.dev.yml exec excel2json-dev sh

# Utility commands
clean:
	@echo "Cleaning up containers and images..."
	docker-compose down --rmi all --volumes --remove-orphans
	docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans

prune:
	@echo "Pruning Docker system..."
	docker system prune -f
	docker volume prune -f

status:
	@echo "Container status:"
	@docker ps -a --filter "label=com.docker.compose.project=excel2json"