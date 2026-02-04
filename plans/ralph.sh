#!/bin/bash

# Ralph Loop - Simple Version
# Usage: ./ralph-simple.sh <iterations>

MAX=${1:-10}  # Default to 10 if not specified

PROMPT="You are in a Ralph loop. Each iteration:

1. Read prd.json - find highest priority item where status != \"done\"
2. Implement ONLY that ONE feature completely  
3. Update prd.json: set that feature's status to \"done\"
4. Append to progress.txt: what you did, decisions, notes
5. Git commit with clear message
6. Use pnpm (not npm/yarn)

Code style: clean, functional, tested, TypeScript strict.
Run 'npx tsc --noEmit' before committing.

When ALL items are done, say: RALPH_COMPLETE"

for ((i=1; i<=MAX; i++)); do
  echo ""
  echo "========== Iteration $i/$MAX =========="
  echo ""
  
  kilo plans/prd.json plans/progress.txt "$PROMPT" || {
    echo "❌ Kilo failed at iteration $i"
    exit 1
  }
  
  sleep 1
done

echo ""
echo "⚠️ Finished $MAX iterations. Check progress.txt for status."