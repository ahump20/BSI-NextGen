#!/usr/bin/env bash
#
# Analytics Testing Script
# Tests analytics integration locally with DevTools
#
# Usage:
#   ./.claude/scripts/test-analytics.sh
#

set -euo pipefail

echo "🔥 Blaze Sports Intel - Analytics Testing"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "packages/web/src/app/pitch-tunnel-simulator/page.tsx" ]; then
  echo "❌ Error: Must run from BSI-NextGen root directory"
  exit 1
fi

# Build packages first
echo "📦 Building packages..."
npx pnpm@latest --filter @bsi/shared build
npx pnpm@latest --filter @bsi/api build
echo "✅ Packages built successfully"
echo ""

# Start dev server
echo "🚀 Starting development server..."
echo "📍 URL: http://localhost:3000/pitch-tunnel-simulator"
echo ""
echo "📋 Testing Checklist:"
echo "===================="
echo ""
echo "1. Open DevTools → Network Tab"
echo "2. Filter by 'analytics'"
echo "3. Navigate to http://localhost:3000/pitch-tunnel-simulator"
echo ""
echo "Expected Events:"
echo "  ✓ page_view - on load"
echo "  ✓ camera_view_changed - when changing camera angle"
echo "  ✓ animation_speed_changed - when adjusting speed slider"
echo "  ✓ simulation_action - when clicking pause/play"
echo "  ✓ strike_zone_toggled - when toggling strike zone"
echo "  ✓ grid_toggled - when toggling grid"
echo "  ✓ pitch_parameters_changed - when adjusting pitch parameters"
echo "  ✓ pitch_preset_selected - when selecting a preset"
echo "  ✓ pitch_added - when adding new pitch"
echo "  ✓ pitch_removed - when removing pitch"
echo "  ✓ pitch_visibility_toggled - when toggling pitch visibility"
echo "  ✓ pitch_combo_loaded - when loading preset combo"
echo "  ✓ pitch_slot_selected - when selecting different pitch slot"
echo ""
echo "Batching Behavior:"
echo "  • Events queue in memory"
echo "  • Batch POST after 10 seconds OR 50 events"
echo "  • Check DevTools Network for POST to /api/analytics"
echo ""
echo "Error Boundary Test:"
echo "  • Open DevTools Console"
echo "  • Type: window.triggerTestError = true"
echo "  • Reload page"
echo "  • Verify error UI displays"
echo "  • Check Network for error event POST"
echo ""
echo "Core Web Vitals:"
echo "  • Open DevTools Console"
echo "  • Look for [Performance] logs after page load"
echo "  • Metrics: CLS, INP, FCP, LCP, TTFB"
echo ""
echo "Press Ctrl+C to stop the server when testing is complete"
echo ""

# Start Next.js dev server
cd packages/web && npx next dev
