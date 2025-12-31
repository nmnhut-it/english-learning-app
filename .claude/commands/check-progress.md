# Check Progress

Display current processing progress from the tracking file.

## Usage
```
/check-progress [grade]
```

Examples:
- `/check-progress` - Show all grades
- `/check-progress 7` - Show only Grade 7

## Instructions for Claude

1. **Read tracking file**:
   ```
   Read: /home/user/english-learning-app/data/lesson-processing/TRACKING.json
   ```

2. **Calculate statistics**:
   - Total lessons
   - Processed (completed)
   - Pending
   - Failed

3. **Display progress**:

   ```
   📊 LESSON PROCESSING PROGRESS
   ============================
   Last Updated: 2024-12-31 10:30:00

   Overall Progress: ████████░░░░░░░░ 45% (120/267)

   By Grade:
   ┌─────────┬──────────┬───────────┬─────────┬────────┐
   │ Grade   │ Total    │ Completed │ Pending │ Failed │
   ├─────────┼──────────┼───────────┼─────────┼────────┤
   │ Grade 6 │ 42       │ 20        │ 22      │ 0      │
   │ Grade 7 │ 49       │ 49        │ 0       │ 0      │ ✅
   │ Grade 8 │ 56       │ 30        │ 26      │ 0      │
   │ Grade 9 │ 48       │ 15        │ 32      │ 1      │ ⚠️
   │ Grade 10│ 40       │ 6         │ 34      │ 0      │
   │ Grade 11│ 32       │ 0         │ 32      │ 0      │
   └─────────┴──────────┴───────────┴─────────┴────────┘

   Recent Activity:
   - ✅ g7-u01-getting-started (2 min ago)
   - ✅ g7-u01-a-closer-look-1 (5 min ago)
   - ❌ g9-u03-skills-1 - Error: Missing vocabulary section

   Next in Queue:
   1. g8-u05-getting-started
   2. g8-u05-a-closer-look-1
   3. g8-u05-a-closer-look-2

   Commands:
   - /process-next          → Process next lesson in queue
   - /process-lesson 8 5 getting-started → Process specific lesson
   - /retry-failed          → Retry all failed lessons
   ```

4. **If grade specified**, show detailed unit breakdown:

   ```
   📚 GRADE 7 DETAILED PROGRESS
   ============================

   Unit 1: Hobbies ████████████████ 100%
   ├── ✅ getting-started
   ├── ✅ a-closer-look-1
   ├── ✅ a-closer-look-2
   ├── ✅ communication
   ├── ✅ skills-1
   ├── ✅ skills-2
   └── ✅ looking-back

   Unit 2: Health ████████░░░░░░░░ 50%
   ├── ✅ getting-started
   ├── ✅ a-closer-look-1
   ├── ✅ a-closer-look-2
   ├── ⏳ communication (pending)
   ├── ⏳ skills-1 (pending)
   ├── ⏳ skills-2 (pending)
   └── ⏳ looking-back (pending)
   ```
