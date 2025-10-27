DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'habit_logs'
  ) THEN
    -- Remove duplicate rows before adding the unique index
    WITH ranked_logs AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY habit_id, user_id, date
          ORDER BY id DESC
        ) AS rn
      FROM habit_logs
    )
    DELETE FROM habit_logs
    WHERE id IN (
      SELECT id FROM ranked_logs WHERE rn > 1
    );

    CREATE UNIQUE INDEX IF NOT EXISTS habit_logs_habit_user_date_unique
      ON habit_logs (habit_id, user_id, date);
  END IF;
END $$;
