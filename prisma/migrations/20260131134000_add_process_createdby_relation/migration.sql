-- Add foreign key constraint for createdById in processes table
-- This establishes the relationship between Process and User models

-- Drop existing foreign key if it exists
PRAGMA foreign_keys = OFF;

-- Create new table with the correct foreign key
CREATE TABLE "new_processes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "steps" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "departmentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "fk_department" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_createdBy" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old table
INSERT INTO "new_processes" ("id", "name", "description", "steps", "createdAt", "updatedAt", "departmentId", "organizationId", "createdById")
SELECT "id", "name", "description", "steps", "createdAt", "updatedAt", "departmentId", "organizationId", "createdById" FROM "processes";

-- Drop old table
DROP TABLE "processes";

-- Rename new table
ALTER TABLE "new_processes" RENAME TO "processes";

PRAGMA foreign_keys = ON;
