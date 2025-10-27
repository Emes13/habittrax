DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'habit_status') THEN
    CREATE TYPE habit_status AS ENUM ('incomplete', 'partial', 'complete', 'not_applicable');
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'habit_status' AND e.enumlabel = 'not_applicable'
    ) THEN
      ALTER TYPE habit_status ADD VALUE 'not_applicable';
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  has_completed_column boolean;
BEGIN
  PERFORM 1
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'habit_logs';

  IF FOUND THEN
    ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS status habit_status;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'habit_logs'
        AND column_name = 'completed'
    ) INTO has_completed_column;

    IF has_completed_column THEN
      UPDATE habit_logs
      SET status = CASE
        WHEN completed IS TRUE THEN 'complete'::habit_status
        WHEN completed IS FALSE THEN 'incomplete'::habit_status
        ELSE COALESCE(status, 'incomplete'::habit_status)
      END
      WHERE status IS NULL OR completed IS NOT NULL;

      ALTER TABLE habit_logs DROP COLUMN completed;
    END IF;

    UPDATE habit_logs
    SET status = COALESCE(status, 'incomplete'::habit_status)
    WHERE status IS NULL;

    ALTER TABLE habit_logs ALTER COLUMN status SET DEFAULT 'incomplete';
    ALTER TABLE habit_logs ALTER COLUMN status SET NOT NULL;
  END IF;
END $$;
