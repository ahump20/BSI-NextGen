.PHONY: help setup install dev test lint format clean deploy db-migrate db-seed

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(CYAN)Blaze Sports Intel - Development Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make $(CYAN)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup & Installation

setup: ## Complete setup - install dependencies and initialize environment
	@echo "$(GREEN)Setting up development environment...$(NC)"
	@npm install
	@cp -n .env.example .env.local 2>/dev/null || true
	@echo "$(GREEN)✓ Dependencies installed$(NC)"
	@echo "$(YELLOW)⚠ Please configure .env.local with your API keys$(NC)"

install: ## Install dependencies only
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@npm install

##@ Development

dev: ## Start Vite dev server (frontend only)
	@echo "$(GREEN)Starting Vite dev server on http://localhost:5173$(NC)"
	@npm run dev

dev-functions: ## Start Wrangler dev server (functions only)
	@echo "$(GREEN)Starting Wrangler dev server on http://localhost:8788$(NC)"
	@wrangler pages dev dist --port 8788 --live-reload

dev-full: ## Start both Vite and Wrangler in parallel
	@echo "$(GREEN)Starting full development environment...$(NC)"
	@echo "$(CYAN)Frontend: http://localhost:5173$(NC)"
	@echo "$(CYAN)Functions: http://localhost:8788$(NC)"
	@npm run dev:full

dev-mobile: ## Start dev server with mobile device tunnel (requires ngrok)
	@echo "$(GREEN)Starting dev server with mobile access...$(NC)"
	@npx ngrok http 5173

##@ Testing

test: ## Run all tests (unit + integration)
	@echo "$(GREEN)Running tests...$(NC)"
	@npm run test

test-unit: ## Run unit tests only
	@echo "$(GREEN)Running unit tests...$(NC)"
	@npm run test:unit

test-e2e: ## Run E2E tests with Playwright
	@echo "$(GREEN)Running E2E tests...$(NC)"
	@npm run test:e2e

test-e2e-ui: ## Run E2E tests with Playwright UI
	@echo "$(GREEN)Opening Playwright UI...$(NC)"
	@npx playwright test --ui

test-coverage: ## Run tests with coverage report
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	@npm run test:coverage
	@echo "$(CYAN)Coverage report: coverage/index.html$(NC)"

##@ Code Quality

lint: ## Run ESLint
	@echo "$(GREEN)Linting code...$(NC)"
	@npm run lint

lint-fix: ## Auto-fix linting issues
	@echo "$(GREEN)Auto-fixing linting issues...$(NC)"
	@npm run lint:fix

format: ## Format code with Prettier
	@echo "$(GREEN)Formatting code...$(NC)"
	@npm run format

format-check: ## Check code formatting
	@echo "$(GREEN)Checking code formatting...$(NC)"
	@npm run format:check

typecheck: ## Run TypeScript type checking
	@echo "$(GREEN)Type checking...$(NC)"
	@npm run typecheck

check: lint typecheck test ## Run all checks (lint, typecheck, test)
	@echo "$(GREEN)✓ All checks passed!$(NC)"

##@ Database

db-migrate: ## Run D1 database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	@wrangler d1 migrations apply blaze-db --local
	@echo "$(GREEN)✓ Local migrations applied$(NC)"
	@echo "$(YELLOW)Run 'make db-migrate-production' to apply to production$(NC)"

db-migrate-production: ## Run migrations on production database
	@echo "$(RED)⚠ WARNING: This will modify the production database!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		wrangler d1 migrations apply blaze-db; \
		echo "$(GREEN)✓ Production migrations applied$(NC)"; \
	else \
		echo "$(YELLOW)Migration cancelled$(NC)"; \
	fi

db-seed: ## Seed local database with test data
	@echo "$(GREEN)Seeding database...$(NC)"
	@npm run db:seed

db-reset: ## Reset local database (drop all tables and re-migrate)
	@echo "$(YELLOW)Resetting local database...$(NC)"
	@rm -f .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
	@$(MAKE) db-migrate
	@$(MAKE) db-seed
	@echo "$(GREEN)✓ Database reset complete$(NC)"

##@ Build & Deploy

build: ## Build for production
	@echo "$(GREEN)Building for production...$(NC)"
	@npm run build
	@echo "$(GREEN)✓ Build complete: dist/$(NC)"

preview: ## Preview production build locally
	@echo "$(GREEN)Starting preview server...$(NC)"
	@npm run preview

deploy: build ## Deploy to Cloudflare Pages
	@echo "$(GREEN)Deploying to Cloudflare Pages...$(NC)"
	@npm run deploy
	@echo "$(GREEN)✓ Deployment complete!$(NC)"

deploy-staging: build ## Deploy to staging environment
	@echo "$(GREEN)Deploying to staging...$(NC)"
	@wrangler pages deploy dist --branch=staging
	@echo "$(GREEN)✓ Staging deployment complete!$(NC)"

##@ Utilities

clean: ## Clean build artifacts and caches
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf dist .wrangler coverage .vite
	@echo "$(GREEN)✓ Clean complete$(NC)"

clean-all: clean ## Deep clean (includes node_modules)
	@echo "$(RED)Deep cleaning...$(NC)"
	@rm -rf node_modules
	@echo "$(GREEN)✓ Deep clean complete$(NC)"
	@echo "$(YELLOW)Run 'make install' to reinstall dependencies$(NC)"

logs: ## Tail Cloudflare Pages logs
	@echo "$(GREEN)Tailing logs...$(NC)"
	@wrangler pages deployment tail

logs-production: ## Tail production logs
	@echo "$(GREEN)Tailing production logs...$(NC)"
	@wrangler pages deployment tail --environment production

update-deps: ## Update dependencies to latest versions
	@echo "$(GREEN)Updating dependencies...$(NC)"
	@npm update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

security-audit: ## Run security audit
	@echo "$(GREEN)Running security audit...$(NC)"
	@npm audit
