#!/usr/bin/env bash
set -euo pipefail

# Mobile Regression Testing Script for BSI-NextGen
# Tests for performance degradation on mobile devices

BASELINE_FILE="${BASELINE_FILE:-.claude/baselines/mobile-perf-baseline.json}"
REPORT_DIR="${REPORT_DIR:-.claude/reports}"
FAIL_THRESHOLD="${FAIL_THRESHOLD:-5}"

echo "🔍 BSI-NextGen Mobile Regression Testing"
echo "========================================"

# Check if baseline exists
if [[ ! -f "$BASELINE_FILE" ]] && [[ "$1" != "--create-baseline" ]]; then
  echo "❌ No baseline found. Create one first:"
  echo "   .claude/tests/mobile-regression.sh --create-baseline"
  exit 1
fi

# Parse arguments
CREATE_BASELINE=false
RUN_PERFORMANCE=false
RUN_ALL=false

for arg in "$@"; do
  case $arg in
    --create-baseline)
      CREATE_BASELINE=true
      ;;
    --performance)
      RUN_PERFORMANCE=true
      ;;
    --all)
      RUN_ALL=true
      ;;
  esac
done

if [[ "$CREATE_BASELINE" == "true" ]]; then
  echo "📊 Creating baseline performance snapshot..."

  # Start dev server
  echo "Starting Next.js dev server..."
  pnpm dev &
  SERVER_PID=$!

  # Wait for server to start
  sleep 5

  # Run Lighthouse on mobile
  echo "Running Lighthouse mobile audit..."
  npx lighthouse http://localhost:3000 \
    --only-categories=performance \
    --preset=mobile \
    --output=json \
    --output-path="$REPORT_DIR/lighthouse-baseline.json" \
    --quiet

  # Extract scores
  LIGHTHOUSE_SCORE=$(node -p "require('$REPORT_DIR/lighthouse-baseline.json').categories.performance.score * 100")
  FCP=$(node -p "require('$REPORT_DIR/lighthouse-baseline.json').audits['first-contentful-paint'].numericValue")
  LCP=$(node -p "require('$REPORT_DIR/lighthouse-baseline.json').audits['largest-contentful-paint'].numericValue")
  CLS=$(node -p "require('$REPORT_DIR/lighthouse-baseline.json').audits['cumulative-layout-shift'].numericValue")

  # Create baseline JSON
  cat > "$BASELINE_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "timezone": "America/Chicago",
  "pages": {
    "/": {
      "lighthouse": $LIGHTHOUSE_SCORE,
      "fcp": $FCP,
      "lcp": $LCP,
      "cls": $CLS
    }
  }
}
EOF

  # Stop server
  kill $SERVER_PID

  echo "✅ Baseline created: $BASELINE_FILE"
  echo "Lighthouse Score: $LIGHTHOUSE_SCORE"
  echo "FCP: ${FCP}ms"
  echo "LCP: ${LCP}ms"
  echo "CLS: $CLS"
  exit 0
fi

if [[ "$RUN_PERFORMANCE" == "true" ]] || [[ "$RUN_ALL" == "true" ]]; then
  echo "🏃 Running performance regression tests..."

  # Start dev server
  pnpm dev &
  SERVER_PID=$!
  sleep 5

  # Run current Lighthouse
  npx lighthouse http://localhost:3000 \
    --only-categories=performance \
    --preset=mobile \
    --output=json \
    --output-path="$REPORT_DIR/lighthouse-current.json" \
    --quiet

  # Extract current scores
  CURRENT_SCORE=$(node -p "require('$REPORT_DIR/lighthouse-current.json').categories.performance.score * 100")
  BASELINE_SCORE=$(node -p "require('$BASELINE_FILE').pages['/'].lighthouse")

  SCORE_DIFF=$(echo "$CURRENT_SCORE - $BASELINE_SCORE" | bc)

  echo "Current Score: $CURRENT_SCORE"
  echo "Baseline Score: $BASELINE_SCORE"
  echo "Difference: $SCORE_DIFF"

  # Check if regression
  if (( $(echo "$SCORE_DIFF < -$FAIL_THRESHOLD" | bc -l) )); then
    echo "❌ Performance regression detected!"
    echo "Score dropped by more than $FAIL_THRESHOLD points"
    kill $SERVER_PID
    exit 1
  else
    echo "✅ Performance within acceptable range"
  fi

  kill $SERVER_PID
fi

echo ""
echo "✅ All mobile regression tests passed!"
