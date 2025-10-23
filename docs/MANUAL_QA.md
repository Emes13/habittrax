# Manual QA - Completion Status Updates

## Charts and Statistics
1. Log in as a user with multiple habits.
2. Ensure at least one habit has entries for **complete**, **partial**, and **incomplete** within the last month.
3. Navigate to **Statistics**.
   - Confirm the "Today's Progress" card shows complete counts in bold and partial counts in warning text.
   - Confirm the completion rate percentage only reflects fully completed habits.
   - Hover over bars and the trend line in "Habit Performance" and verify the tooltip text includes the complete/total summary and partial counts when present.
4. From the **Weekly Overview** calendar, verify days with mixed statuses are marked as partial, fully complete days are green, and incomplete days are red.

## Streaks
1. Navigate to the dashboard Habit list.
2. For a habit with a current streak, mark the most recent day as **partial** and ensure the streak count resets to zero.
3. Mark the same day as **complete** and confirm the streak count resumes (e.g., increases from the previous day).
4. Repeat for multiple days to verify the streak only progresses when the status is "complete".

## Reminders
1. Configure a habit with a reminder time that has already passed (e.g., morning reminder after 9 AM).
2. Log the habit as **partial** for today.
   - Confirm the reminder toast reads “Keep going: … is partially complete.”
3. Update the habit to **complete** and ensure no further reminder toasts appear.
4. Create a different habit with no status logged and wait for the reminder window; confirm the toast uses the generic reminder message.
