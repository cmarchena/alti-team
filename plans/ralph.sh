#!/bin/bash

# Ralph Loop - Autonomous Mode
# Usage: ./ralph.sh <iterations>

MAX=${1:-10}

PROMPT="You are working in a Ralph loop (https://ghuntley.com/ralph/).

IMPORTANT: Start in orchestrator mode to coordinate the work, then switch to code mode for implementation.

CONTEXT FILES:
- PRD: plans/prd.json
- Progress: plans/progress.txt

Your job:
1. Read plans/prd.json and traverse ALL nested feature objects under features.{category}.{feature-id} to find the highest priority feature where status != 'done'. Features are nested: features.presence.presence-001, features.chat.chat-002, features.video.video-001, etc. DO NOT look for status at the category level - you must iterate through each category object to find individual feature entries.
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
- Run linting (pnpm lint) and fix all errors
- Run unit tests (pnpm test) and ensure all pass
- Run E2E tests (pnpm test:e2e) if applicable to the changes
- Verify production build succeeds (pnpm build)
- Fix any TypeScript errors you encounter
- Ensure the code compiles cleanly
- Use @/lib/auth for authOptions, @/generated for Prisma

ARCHITECTURE RULES (CRITICAL - MUST FOLLOW):
- NEVER create repository patterns (*.repository.ts) in the front-end
- Front-end MUST only communicate with back-end via API calls
- Back-end handles all database access via Repository Pattern
- No direct database connections from front-end
- No Prisma/client in front-end code

WORKFLOW (MUST FOLLOW EXACTLY):
1. Start in orchestrator mode to coordinate the work
2. Implement the feature using code mode
3. Run type-checking (npx tsc --noEmit)
4. IF type checking fails: Fix errors and go to step 3 (max 3 loops)
5. For testing phase: Use orchestrator mode to spawn TWO PARALLEL agents:
   - Agent 1: Run E2E tests on front (pnpm test:e2e)
   - Agent 2: Run Jest tests on back (pnpm test)
   - Wait for both agents to complete before proceeding
6. IF any tests fail: Refactor and go to step 3 (max 3 loops total)
7. IF all tests pass: Commit and mark feature as done
8. IF after 3 loops tests still fail: Output RALPH_FAILED - DO NOT COMMIT

If ALL nested features across ALL categories in plans/prd.json have status \"done\", output exactly:
RALPH_COMPLETE"

for ((i=1; i<=MAX; i++)); do
  echo ""
  echo "========== Iteration $i/$MAX =========="
  echo ""

  kilo run -m kilo/z-ai/glm-5:free "$PROMPT" || {
    echo "Kilo failed at iteration $i"
    exit 1
  }

  sleep 1
done

echo ""
echo "Finished $MAX iterations. Check progress.txt for status."
