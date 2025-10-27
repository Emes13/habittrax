DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'habit_status') THEN
    ALTER TYPE habit_status ADD VALUE IF NOT EXISTS 'not_applicable';
  ELSE
    CREATE TYPE habit_status AS ENUM ('incomplete', 'partial', 'complete', 'not_applicable');
  END IF;
END $$;
