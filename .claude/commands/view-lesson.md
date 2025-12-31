# View Processed Lesson

Display the structured content of a processed lesson.

## Usage
```
/view-lesson <grade> <unit> <section>
```

Example: `/view-lesson 7 1 getting-started`

## Instructions for Claude

1. **Read the output file**:
   ```
   Read: /home/user/english-learning-app/data/lesson-processing/output/g{grade}/u{unit:02d}/{section}.json
   ```

2. **If not found**:
   ```
   ❌ Lesson not processed yet.

   Run: /process-lesson 7 1 getting-started
   ```

3. **Display summary**:
   ```
   📚 LESSON: g7-u01-getting-started
   ==================================

   📋 Metadata:
   - Grade: 7
   - Unit: 1 - Hobbies
   - Section: Getting Started
   - Duration: ~15 minutes
   - XP: 125 points

   📊 Content Blocks:
   ┌────────────────────┬───────┐
   │ Block Type         │ Count │
   ├────────────────────┼───────┤
   │ Vocabulary         │ 18    │
   │ Dialogue           │ 1     │
   │ Exercise           │ 4     │
   │ Grammar            │ 0     │
   │ Reading            │ 0     │
   │ Listening          │ 0     │
   │ Pronunciation      │ 1     │
   │ Instruction        │ 5     │
   └────────────────────┴───────┘

   📖 Vocabulary Preview:
   1. hobby (n) /ˈhɒbi/ - sở thích
   2. amazing (adj) /əˈmeɪzɪŋ/ - tuyệt vời
   3. build (v) /bɪld/ - xây dựng
   ... and 15 more

   💬 Dialogue:
   - Ann: Your house is very nice, Trang.
   - Trang: Thanks! Let's go upstairs...
   ... 8 more lines

   ✏️ Exercises:
   1. [true_false] 5 questions
   2. [matching] 6 items
   3. [table_classification] 3 categories
   4. [multiple_choice] 4 questions

   View full JSON: /home/user/english-learning-app/data/lesson-processing/output/g7/u01/getting-started.json
   ```
