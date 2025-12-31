# Retry Failed Lessons

Reprocess all lessons that previously failed.

## Usage
```
/retry-failed [grade]
```

Examples:
- `/retry-failed` - Retry all failed lessons
- `/retry-failed 9` - Retry only Grade 9 failed lessons

## Instructions for Claude

1. **Read tracking file**

2. **Find all failed lessons**:
   - Status = "failed"
   - Collect error messages

3. **Display failed lessons**:
   ```
   ❌ FAILED LESSONS
   =================

   1. g9-u03-skills-1
      Error: Missing vocabulary section
      Last attempt: 2024-12-31 10:30:00

   2. g8-u07-a-closer-look-2
      Error: Could not parse grammar block
      Last attempt: 2024-12-31 09:15:00

   Total: 2 failed lessons

   Retrying...
   ```

4. **Reprocess each failed lesson**:
   - Reset status to "processing"
   - Follow /process-lesson steps
   - Update status based on result

5. **Report results**:
   ```
   ═══════════════════════════════════════
   📊 RETRY COMPLETE
   ═══════════════════════════════════════

   Retried: 2 lessons
   ✅ Now Success: 1
   ❌ Still Failed: 1

   Still failing:
   - g8-u07-a-closer-look-2: Could not parse grammar block
     Suggestion: Check markdown format manually
   ```
