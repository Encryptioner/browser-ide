#!/bin/bash

# Browser IDE Pro - Production Deployment Script
# This script automates the deployment process with pre-flight checks

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Header
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   Browser IDE Pro Deployment Script   ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Check prerequisites
print_step "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_success "Node.js installed: $(node --version)"

if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Install with: npm install -g pnpm"
    exit 1
fi
print_success "pnpm installed: $(pnpm --version)"

# Step 2: Check git status
print_step "Checking git status..."

if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
else
    print_success "Working directory clean"
fi

# Step 3: Install dependencies
print_step "Installing dependencies..."
pnpm install --frozen-lockfile
print_success "Dependencies installed"

# Step 4: Type checking
print_step "Running type check..."
if pnpm type-check; then
    print_success "Type check passed"
else
    print_error "Type check failed"
    exit 1
fi

# Step 5: Linting (optional, won't fail deployment)
print_step "Running linter..."
if pnpm lint; then
    print_success "Linting passed"
else
    print_warning "Linting found issues (non-blocking)"
fi

# Step 6: Build
print_step "Building for production..."
pnpm build
print_success "Build completed"

# Step 7: Check build output
print_step "Checking build output..."

if [ ! -d "dist" ]; then
    print_error "dist directory not found"
    exit 1
fi

DIST_SIZE=$(du -sh dist | cut -f1)
print_success "Build size: $DIST_SIZE"

# Count files
FILE_COUNT=$(find dist -type f | wc -l | tr -d ' ')
print_success "Files generated: $FILE_COUNT"

# Step 8: Preview (optional)
print_step "Preview build?"
read -p "Start preview server? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Starting preview server..."
    print_success "Preview at http://localhost:4173"
    print_warning "Press Ctrl+C to stop preview and continue deployment"
    pnpm preview
fi

# Step 9: Deploy
echo
print_step "Ready to deploy!"
echo
echo "Choose deployment target:"
echo "  1) GitHub Pages (gh-pages)"
echo "  2) Manual (files in dist/)"
echo "  3) Cancel"
echo

read -p "Enter choice [1-3]: " -n 1 -r
echo

case $REPLY in
    1)
        print_step "Deploying to GitHub Pages..."

        if ! command -v gh-pages &> /dev/null; then
            print_warning "gh-pages not found in PATH, trying npx..."
            npx gh-pages -d dist
        else
            pnpm deploy
        fi

        print_success "Deployed to GitHub Pages!"
        print_success "Visit: https://$(git config user.name).github.io/$(basename $(git rev-parse --show-toplevel))"
        ;;
    2)
        print_success "Build complete! Files in dist/ directory"
        print_step "Upload the dist/ directory to your hosting provider"
        ;;
    3)
        print_warning "Deployment cancelled"
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo
echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║      Deployment completed! 🎉         ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Step 10: Post-deployment checklist
echo
print_step "Post-deployment checklist:"
echo "  [ ] Verify app loads without errors"
echo "  [ ] Test all major features"
echo "  [ ] Check service worker registration"
echo "  [ ] Test PWA installation"
echo "  [ ] Verify responsive design"
echo "  [ ] Run Lighthouse audit"
echo "  [ ] Check security headers"
echo

print_success "Deployment script completed successfully!"
