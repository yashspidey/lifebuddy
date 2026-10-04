# LifeBuddy Demo Script (60–90 seconds)

1. **Dashboard (0:00–0:15)** — Open the app. Show the greeting, today's date, progress bar, and the tasks due today and overdue. Mention the banner: "Demo mode" badge, or "Live local AI" if Ollama is running.

2. **Task dump (0:15–0:30)** — Go to **AI Planner**, paste:
   ```
   Finish history essay due tonight
   Calculus problem set due tomorrow
   Email professor about extension
   Buy groceries
   Group project slides due Friday
   ```
   Click **Import tasks** — the AI (or demo mode) turns it into structured tasks. Open the **Tasks** tab to show them.

3. **Generate a plan (0:30–0:45)** — Back in the planner, set 3 hours / medium energy, click **Generate plan**. Show the scheduled items with start times, the explanation of priorities, and the overflow warning if there's more work than time. Edit or remove one item live. Click **Re-plan** with "Low energy" to show an adjusted plan.

4. **Breakdown (0:45–1:00)** — Go to **Break it down**, pick "Finish history essay draft", click **Suggest steps**, and check off two steps to persist progress.

5. **Progress (1:00–1:10)** — Switch to **Progress**: donut, workload bars, and click **Summarize my day** for the end-of-day reflection.

6. **Why open source & local (1:10–1:25)** — Point at the AI status banner: with Ollama running (`ollama serve`, model pulled), the same features run against a local open-weight model; tasks never leave the browser except to the local Ollama server. Show Settings → data clearing.

**Closing line:** "LifeBuddy is LifeBuddy for the real world — a friend's overloaded week, turned into a plan they can actually finish, with their data staying on their machine."
