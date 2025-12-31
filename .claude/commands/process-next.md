# Process Next Lesson

Automatically process the next pending lesson from the queue.

## Usage
```
/process-next [count]
```

Examples:
- `/process-next` - Process 1 lesson
- `/process-next 5` - Process 5 lessons sequentially

## Instructions for Claude

1. **Read tracking file**:
   ```
   Read: /home/user/english-learning-app/data/lesson-processing/TRACKING.json
   ```

2. **Find next pending lesson**:
   - Priority order: Grade 7 → 8 → 9 → 6 → 10 → 11
   - Within grade: Unit 1 → 2 → ... → 12
   - Within unit: getting-started → a-closer-look-1 → ... → looking-back

3. **If no pending lessons**:
   ```
   ✅ All lessons have been processed!

   Total: XXX lessons
   Completed: XXX
   Failed: XXX

   Run /retry-failed to reprocess failed lessons.
   ```

4. **Process the lesson**:
   Follow the same steps as `/process-lesson`:
   - Read markdown file
   - Extract content blocks
   - Save to output file
   - Update tracking

5. **After each lesson**:
   ```
   ✅ [1/5] Processed g7-u01-getting-started
   📊 Stats: 15 vocab, 4 exercises, 1 dialogue
   ⏱️ Duration: 2.3s

   Processing next...
   ```

6. **After all lessons in batch**:
   ```
   ═══════════════════════════════════════
   📊 BATCH PROCESSING COMPLETE
   ═══════════════════════════════════════

   Processed: 5 lessons
   ✅ Success: 5
   ❌ Failed: 0
   ⏱️ Total time: 12.5s

   Overall Progress: ████████░░░░░░░░ 48% (125/267)

   Run /process-next to continue, or /check-progress for details.
   ```

7. **If a lesson fails**:
   - Mark as "failed" in tracking
   - Log error message
   - Continue to next lesson
   - Report at end

## Auto-Continue Mode

If user says `/process-next all` or `/process-next -a`:
- Process ALL pending lessons
- Show progress every 10 lessons
- Stop if 3 consecutive failures
