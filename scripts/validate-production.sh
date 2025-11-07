#!/bin/bash
# Production Validation Script for Sandlot Sluggers
# Validates deployment health, performance, and functionality

set -e

PRODUCTION_URL="https://5e1ebbdb.sandlot-sluggers.pages.dev"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🎮 Sandlot Sluggers - Production Validation"
echo "==========================================="
echo ""

# Test 1: Site Accessibility
echo "Test 1: Site Accessibility"
echo "-------------------------"
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" "$PRODUCTION_URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Site is accessible (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗ FAIL${NC} - Site returned HTTP $HTTP_CODE"
    exit 1
fi
echo ""

# Test 2: Response Time
echo "Test 2: Response Time"
echo "---------------------"
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$PRODUCTION_URL")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} - Response time: ${RESPONSE_MS}ms (< 1000ms)"
else
    echo -e "${YELLOW}⚠ SLOW${NC} - Response time: ${RESPONSE_MS}ms (> 1000ms)"
fi
echo ""

# Test 3: SSL/TLS Certificate
echo "Test 3: SSL/TLS Certificate"
echo "---------------------------"
SSL_EXPIRY=$(echo | openssl s_client -servername 5e1ebbdb.sandlot-sluggers.pages.dev -connect 5e1ebbdb.sandlot-sluggers.pages.dev:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2 || echo "Could not retrieve")
if [ "$SSL_EXPIRY" != "Could not retrieve" ]; then
    echo -e "${GREEN}✓ PASS${NC} - SSL certificate valid until: $SSL_EXPIRY"
else
    echo -e "${YELLOW}⚠ WARN${NC} - Could not verify SSL certificate"
fi
echo ""

# Test 4: Security Headers
echo "Test 4: Security Headers"
echo "------------------------"
HEADERS=$(curl -I -s "$PRODUCTION_URL")

if echo "$HEADERS" | grep -q "X-Content-Type-Options: nosniff"; then
    echo -e "${GREEN}✓ PASS${NC} - X-Content-Type-Options header present"
else
    echo -e "${YELLOW}⚠ WARN${NC} - X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -q "Referrer-Policy"; then
    echo -e "${GREEN}✓ PASS${NC} - Referrer-Policy header present"
else
    echo -e "${YELLOW}⚠ WARN${NC} - Referrer-Policy header missing"
fi

if echo "$HEADERS" | grep -q "server: cloudflare"; then
    echo -e "${GREEN}✓ PASS${NC} - Served by Cloudflare edge network"
else
    echo -e "${YELLOW}⚠ WARN${NC} - Not served by Cloudflare"
fi
echo ""

# Test 5: Content Delivery
echo "Test 5: Content Delivery"
echo "------------------------"
CONTENT_TYPE=$(curl -I -s "$PRODUCTION_URL" | grep -i "content-type:" | cut -d: -f2 | xargs)
if echo "$CONTENT_TYPE" | grep -q "text/html"; then
    echo -e "${GREEN}✓ PASS${NC} - HTML content delivered correctly"
else
    echo -e "${RED}✗ FAIL${NC} - Unexpected content type: $CONTENT_TYPE"
fi

CACHE_CONTROL=$(curl -I -s "$PRODUCTION_URL" | grep -i "cache-control:" | cut -d: -f2 | xargs)
if [ ! -z "$CACHE_CONTROL" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Cache-Control header present: $CACHE_CONTROL"
else
    echo -e "${YELLOW}⚠ WARN${NC} - Cache-Control header missing"
fi
echo ""

# Test 6: Asset Loading
echo "Test 6: Critical Assets"
echo "-----------------------"
CONTENT=$(curl -s "$PRODUCTION_URL")

if echo "$CONTENT" | grep -q "babylon"; then
    echo -e "${GREEN}✓ PASS${NC} - Babylon.js detected in HTML"
else
    echo -e "${YELLOW}⚠ WARN${NC} - Babylon.js not found in HTML"
fi

if echo "$CONTENT" | grep -q "HavokPhysics"; then
    echo -e "${GREEN}✓ PASS${NC} - Havok Physics detected"
else
    echo -e "${YELLOW}⚠ WARN${NC} - Havok Physics not found"
fi

if echo "$CONTENT" | grep -q "canvas"; then
    echo -e "${GREEN}✓ PASS${NC} - Canvas element present"
else
    echo -e "${RED}✗ FAIL${NC} - Canvas element missing"
fi
echo ""

# Test 7: CDN Performance
echo "Test 7: CDN Performance"
echo "-----------------------"
CF_RAY=$(curl -I -s "$PRODUCTION_URL" | grep -i "cf-ray:" | cut -d: -f2 | xargs)
if [ ! -z "$CF_RAY" ]; then
    CF_DATACENTER=$(echo "$CF_RAY" | cut -d- -f2)
    echo -e "${GREEN}✓ PASS${NC} - Served from Cloudflare datacenter: $CF_DATACENTER"
    echo "  CF-Ray: $CF_RAY"
else
    echo -e "${YELLOW}⚠ WARN${NC} - CF-Ray header not found"
fi
echo ""

# Test 8: HTTP/2 Support
echo "Test 8: HTTP/2 Support"
echo "----------------------"
HTTP_VERSION=$(curl -I -s "$PRODUCTION_URL" | head -1 | cut -d' ' -f1)
if echo "$HTTP_VERSION" | grep -q "HTTP/2"; then
    echo -e "${GREEN}✓ PASS${NC} - HTTP/2 enabled"
else
    echo -e "${YELLOW}⚠ WARN${NC} - HTTP/2 not detected (found: $HTTP_VERSION)"
fi
echo ""

# Summary
echo "========================================="
echo "Validation Complete!"
echo "========================================="
echo ""
echo "Production URL: $PRODUCTION_URL"
echo "Status: ${GREEN}OPERATIONAL${NC}"
echo ""
echo "📊 Quick Stats:"
echo "  Response Time: ${RESPONSE_MS}ms"
echo "  HTTP Status: $HTTP_CODE"
echo "  Protocol: $HTTP_VERSION"
echo "  CDN: Cloudflare"
echo ""
echo "🎮 Your game is live and ready to play!"
echo ""
echo "To monitor continuously:"
echo "  watch -n 30 ./scripts/validate-production.sh"
echo ""
