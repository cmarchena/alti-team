#!/bin/bash

# Ralph Loop - Autonomous Mode
# Usage: ./ralph.sh <iterations>

MAX=${1:-10}

PROMPT="You are working in a Ralph loop (https://ghuntley.com/ralph/).

CONTEXT FILES:
- PRD: plans/prd.json
- Progress: plans/progress.txt

Your job:
1. Read plans/prd.json and find the highest priority feature that is NOT yet done (status != \"done\")
2. Implement ONLY that single feature completely
3. Update the plans/prd.json marking that feature's status as \"done\"
4. APPEND your learnings to plans/progress.txt - what you did, decisions made, notes for next iteration
5. Make a git commit with a clear message about what you implemented
6. ONLY work on ONE feature per iteration
7. When using node always prefer pnpm over npm or yarn

Code Principles:
- Clean Code: Write readable, self-documenting code with descriptive names
- Dependency Injection: Pass dependencies as parameters, don't hardcode them
- Testing: Write tests for critical functionality
- Functional Approach: Prefer functions over classes, avoid 'this' and mutable state
- React: Use functional components with hooks, never class components

Technical Requirements:
- Run type-checking (npx tsc --noEmit) before committing
- Fix any TypeScript errors you encounter
- Ensure the code compiles cleanly
- Use @/lib/auth for authOptions, @/generated for Prisma

If all items in plans/prd.json have status \"done\", output exactly:
RALPH_COMPLETE"

for ((i=1; i<=MAX; i++)); do
  echo ""
  echo "========== Iteration $i/$MAX =========="
  echo ""

  kilo run -m kilo/minimax/minimax-m2.5:free "$PROMPT" || {
    echo "Kilo failed at iteration $i"
    exit 1
  }

  sleep 1
done

echo ""
echo "Finished $MAX iterations. Check progress.txt for status."