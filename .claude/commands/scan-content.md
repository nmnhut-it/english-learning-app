# Scan Content - Populate Tracking File

Scan all markdown files and update the tracking file with available lessons.

## Usage
```
/scan-content
```

## Instructions for Claude

1. **Scan all markdown directories**:
   ```bash
   # Scan these directories
   markdown-files/formatg6/
   markdown-files/g7/
   markdown-files/g8/
   markdown-files/g9/
   markdown-files/g10/
   markdown-files/g11/
   markdown-files/global-success-7/
   markdown-files/global-success-8/
   markdown-files/global-success-9/
   markdown-files/global-success-10/
   markdown-files/global-success-11/
   ```

2. **For each grade directory**, find all unit folders and section files

3. **Map section names**:
   - `getting-started` → Getting Started
   - `a-closer-look-1` → A Closer Look 1
   - `a-closer-look-2` → A Closer Look 2
   - `communication` → Communication
   - `skills-1` → Skills 1
   - `skills-2` → Skills 2
   - `looking-back` → Looking Back
   - `language` → Language (Grade 10-11)
   - `reading` → Reading (Grade 10-11)
   - `speaking` → Speaking (Grade 10-11)
   - `listening` → Listening (Grade 10-11)
   - `writing` → Writing (Grade 10-11)
   - `communication-culture` → Communication & Culture (Grade 10-11)

4. **Update TRACKING.json**:
   ```json
   {
     "meta": {
       "lastUpdated": "<ISO timestamp>",
       "totalLessons": <count>,
       "processedLessons": 0,
       "pendingLessons": <count>,
       "failedLessons": 0
     },
     "grades": {
       "7": {
         "status": "pending",
         "units": {
           "1": {
             "title": "Hobbies",
             "sections": {
               "getting-started": {
                 "status": "pending",
                 "sourceFile": "markdown-files/g7/unit-01/g7_u01_getting-started.md",
                 "outputFile": null
               },
               "a-closer-look-1": { ... }
             }
           }
         }
       }
     }
   }
   ```

5. **Create output directories**:
   ```bash
   mkdir -p data/lesson-processing/output/g{6..11}/u{01..12}/
   ```

6. **Save updated tracking file**

7. **Report summary**:
   ```
   📊 Content Scan Complete
   ========================
   Grade 6:  XX lessons found
   Grade 7:  XX lessons found
   Grade 8:  XX lessons found
   Grade 9:  XX lessons found
   Grade 10: XX lessons found
   Grade 11: XX lessons found
   ========================
   Total: XXX lessons to process

   Run /process-next to start processing, or /process-lesson <grade> <unit> <section> for specific lesson.
   ```
