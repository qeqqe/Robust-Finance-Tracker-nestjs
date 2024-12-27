-- First add the columns with nullable constraint
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Update existing rows with default values
UPDATE "User" 
SET "createdAt" = NOW(),
    "updatedAt" = NOW();

-- Then make the columns required
ALTER TABLE "User" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Add default value for future rows
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Rest of your schema changes
-- ... Add other tables and modifications ...
