-- First add the columns as nullable
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- Update existing rows with current timestamp
UPDATE "User"
SET "createdAt" = CURRENT_TIMESTAMP,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "createdAt" IS NULL
   OR "updatedAt" IS NULL;

-- Make the columns required after setting default values
ALTER TABLE "User"
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- Add default value for createdAt for future rows
ALTER TABLE "User"
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
