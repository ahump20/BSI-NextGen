#!/bin/bash
set -e

echo "=== BSI-NextGen Analytics Integration Test ==="
echo

# Test 1: Check dev server is running
echo "✓ Test 1: Dev server health check"
if curl -s http://localhost:3000 > /dev/null; then
  echo "  ✅ Dev server is running on http://localhost:3000"
else
  echo "  ❌ Dev server is not responding"
  exit 1
fi
echo

# Test 2: Test Analytics API endpoint
echo "✓ Test 2: Analytics API endpoint"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "session": {
      "sessionId": "test-session-123",
      "userId": "test-user",
      "startTime": 1732111111000,
      "lastActivity": 1732111111000,
      "pageViews": 1,
      "events": 1
    },
    "events": [
      {
        "name": "test_event",
        "properties": {
          "test": "value"
        },
        "timestamp": 1732111111000
      }
    ],
    "timestamp": 1732111111000
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "  ✅ Analytics API is accepting events"
  echo "  Response: $RESPONSE"
else
  echo "  ❌ Analytics API failed"
  echo "  Response: $RESPONSE"
  exit 1
fi
echo

# Test 3: Check pitch tunnel simulator page
echo "✓ Test 3: Pitch Tunnel Simulator page"
if curl -s http://localhost:3000/pitch-tunnel-simulator | grep -q "Pitch Tunnel Simulator"; then
  echo "  ✅ Pitch Tunnel Simulator page loads successfully"
else
  echo "  ❌ Pitch Tunnel Simulator page failed to load"
  exit 1
fi
echo

# Test 4: Verify analytics tracking code exists
echo "✓ Test 4: Analytics tracking integration"
TRACKING_CALLS=$(grep -c "analytics\.track" /Users/AustinHumphrey/BSI-NextGen/packages/web/src/app/pitch-tunnel-simulator/page.tsx)
echo "  ✅ Found $TRACKING_CALLS analytics tracking calls in pitch tunnel simulator"
echo

echo "=== All Analytics Tests Passed ✅ ==="
echo
echo "Next steps:"
echo "1. Visit http://localhost:3000/pitch-tunnel-simulator in your browser"
echo "2. Open browser DevTools Console to see analytics events"
echo "3. Interact with the simulator to trigger events"
echo "4. Watch for '[Analytics API] Received payload:' logs in terminal"
