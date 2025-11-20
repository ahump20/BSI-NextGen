#!/bin/bash

# Local Development Setup for Blaze Trends Worker
# Sets up everything needed for local development

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the cloudflare-workers/blaze-trends directory"
    exit 1
fi

print_header "Blaze Trends Local Development Setup"

# Step 1: Check Node.js
print_info "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 20+"
    exit 1
fi

# Step 2: Check wrangler
print_info "Checking wrangler CLI..."
if command -v wrangler &> /dev/null; then
    WRANGLER_VERSION=$(wrangler --version)
    print_success "Wrangler installed: $WRANGLER_VERSION"
else
    print_warning "Wrangler not found. Installing globally..."
    npm install -g wrangler
    print_success "Wrangler installed"
fi

# Step 3: Install dependencies
print_header "Installing Dependencies"
npm install
print_success "Dependencies installed"

# Step 4: Check authentication
print_header "Checking Cloudflare Authentication"
if wrangler whoami &> /dev/null; then
    print_success "Already authenticated with Cloudflare"
else
    print_warning "Not authenticated with Cloudflare"
    read -p "Would you like to authenticate now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        wrangler login
    else
        print_info "You can authenticate later with: wrangler login"
    fi
fi

# Step 5: Check for .dev.vars file
print_header "Checking Local Environment Variables"
if [ ! -f ".dev.vars" ]; then
    print_warning ".dev.vars file not found. Creating from template..."
    cat > .dev.vars << 'EOF'
# Local development environment variables
# DO NOT COMMIT THIS FILE

# OpenAI API Key (required for trend analysis)
OPENAI_API_KEY=your_openai_api_key_here

# Brave Search API Key (required for news aggregation)
BRAVE_API_KEY=your_brave_api_key_here
EOF
    print_success ".dev.vars created - PLEASE ADD YOUR API KEYS"
    print_warning "Edit .dev.vars and add your OpenAI and Brave API keys"
else
    print_success ".dev.vars file exists"
fi

# Step 6: Verify wrangler.toml
print_header "Checking Configuration"
if [ -f "wrangler.toml" ]; then
    print_success "wrangler.toml found"

    # Check if account_id is set
    if grep -q "YOUR_ACCOUNT_ID" wrangler.toml; then
        print_warning "account_id not configured in wrangler.toml"
        if wrangler whoami &> /dev/null; then
            ACCOUNT_ID=$(wrangler whoami | grep "Account ID:" | awk '{print $3}')
            if [ ! -z "$ACCOUNT_ID" ]; then
                print_info "Your account ID: $ACCOUNT_ID"
                print_info "Update wrangler.toml with this ID"
            fi
        fi
    else
        print_success "account_id configured"
    fi
else
    print_error "wrangler.toml not found!"
    exit 1
fi

# Step 7: Database setup instructions
print_header "Database Setup"
print_info "To set up the database, run these commands:"
echo -e "  ${GREEN}npm run db:create${NC}      # Create D1 database"
echo -e "  ${GREEN}npm run db:init${NC}        # Initialize schema"
echo ""
print_warning "After creating the database, update wrangler.toml with the database_id"

# Step 8: KV namespace instructions
print_header "KV Namespace Setup"
print_info "To set up KV namespaces, run these commands:"
echo -e "  ${GREEN}npm run kv:create${NC}          # Create production KV"
echo -e "  ${GREEN}npm run kv:create:preview${NC}  # Create preview KV"
echo ""
print_warning "After creating KV namespaces, update wrangler.toml with the IDs"

# Step 9: Display next steps
print_header "Setup Complete!"
cat << EOF

${GREEN}Next Steps:${NC}

1. ${YELLOW}Configure API Keys:${NC}
   Edit .dev.vars and add your OpenAI and Brave API keys

2. ${YELLOW}Update wrangler.toml:${NC}
   - Set your account_id
   - Run database setup commands above
   - Run KV namespace setup commands above

3. ${YELLOW}Start Development Server:${NC}
   npm run dev

4. ${YELLOW}Test Endpoints:${NC}
   Visit http://localhost:8787/health

${BLUE}Useful Commands:${NC}
  npm run dev              # Start development server
  npm run deploy           # Deploy to Cloudflare
  npm run tail             # View logs
  ./scripts/db-utils.sh    # Database utilities

${BLUE}Documentation:${NC}
  README.md                # Technical overview
  DEPLOYMENT.md            # Complete deployment guide

${GREEN}Happy coding! 🔥${NC}
EOF
