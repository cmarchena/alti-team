#!/bin/bash

# Ralph Once (Goose Edition) - Human-in-the-loop Mode
# Usage: ./plans/ralph-once.sh

set -e

echo "🔄 Running Ralph with Goose (single iteration)..."
echo ""

# Usamos --text para que acepte el string del prompt directamente
goose run --text "$(cat <<EOF
You are working in a Ralph loop (https://ghuntley.com/ralph/).

CONTEXT:
- PRD: plans/prd.json
- Progress: plans/progress.txt

Your job:
1. Read plans/prd.json and find the highest priority feature that is NOT yet done (status != "done")
2. Implement ONLY that single feature completely
3. Update the plans/prd.json marking that feature's status as "done"
4. APPEND your learnings to plans/progress.txt - what you did, decisions made, notes for next iteration
5. Make a git commit with a clear message about what you implemented
6. ONLY work on ONE feature per iteration
7. When using node always prefer pnpm over npm or yarn

Code Principles (MUST follow):
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

If all items in plans/prd.json have status "done", output exactly:
PROMISE_COMPLETE_HERE
EOF
)"

echo ""
echo "✅ Iteration complete. Check git log and progress.txt"