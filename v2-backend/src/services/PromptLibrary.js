/**
 * Prompt Library for Strict Content Extraction
 * Ensures LLM extracts ONLY existing content without invention
 */

export const PromptLibrary = {
  /**
   * Clean raw content by removing repetitive navigation menus
   */
  cleanContent(rawContent) {
    const lines = rawContent.split('\n');
    
    // Find where actual content starts
    const startMarkers = [
      'Lựa chọn câu để xem lời giải nhanh hơn',
      'Pronunciation', 'Vocabulary', 'Grammar',
      'Bài 1', 'Video hướng dẫn giải',
      'Listen and read', 'Work in pairs'
    ];
    
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (startMarkers.some(marker => lines[i].includes(marker))) {
        startIndex = i;
        break;
      }
    }
    
    // Find where footer/navigation ends
    const endMarkers = [
      'TẢI APP ĐỂ XEM OFFLINE',
      'BÀI GIẢI MỚI NHẤT',
      'Liên hệ Chính sách',
      'Copyright ©'
    ];
    
    let endIndex = lines.length;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (endMarkers.some(marker => lines[i].includes(marker))) {
        endIndex = i;
        break;
      }
    }
    
    // Extract clean content
    const cleanLines = lines.slice(
      Math.max(0, startIndex - 2),
      endIndex
    );
    
    return cleanLines.join('\n');
  },

  /**
   * Lesson type configurations
   */
  lessonTypes: {
    getting_started: {
      focus: 'dialogues, conversations, topic introduction',
      expectedContent: ['dialogue transcripts', 'speaker names', 'conversational vocabulary']
    },
    language: {
      focus: 'pronunciation rules, vocabulary definitions, grammar structures',
      expectedContent: ['pronunciation guides', 'vocabulary with meanings', 'grammar rules', 'example sentences']
    },
    reading: {
      focus: 'reading passages, comprehension questions, text analysis',
      expectedContent: ['reading text', 'comprehension questions', 'vocabulary from passage']
    },
    speaking: {
      focus: 'speaking activities, instructions, oral exercises',
      expectedContent: ['speaking prompts', 'instruction steps', 'useful expressions']
    },
    listening: {
      focus: 'listening exercises, audio transcripts, comprehension',
      expectedContent: ['listening questions', 'audio content references', 'comprehension checks']
    },
    writing: {
      focus: 'writing tasks, text structure, written exercises',
      expectedContent: ['writing prompts', 'model texts', 'writing vocabulary']
    },
    communication_culture: {
      focus: 'cultural content, communication strategies, CLIL',
      expectedContent: ['cultural information', 'communication phrases', 'comparison tables']
    },
    looking_back: {
      focus: 'unit review, consolidation exercises, self-assessment',
      expectedContent: ['review exercises', 'summary content', 'self-check activities']
    }
  },

  /**
   * Generate strict extraction prompt
   */
  generatePrompt(grade, lessonType, unitTitle, cleanedContent) {
    const lessonConfig = this.lessonTypes[lessonType] || this.lessonTypes.getting_started;
    const gradeGroup = grade <= 9 ? "6-9" : "10-12";
    
    return `You are a precise content extraction tool. Your ONLY job is to extract and structure content that ALREADY EXISTS in the provided text.

CRITICAL RULES - VIOLATION OF THESE RULES IS NOT ACCEPTABLE:
1. ONLY extract text that appears VERBATIM in the content
2. NEVER create, invent, or generate new content
3. NEVER paraphrase or modify original text
4. If a definition doesn't exist in the text, leave it empty
5. If a translation isn't provided, leave it empty
6. If an answer isn't given, mark as "not_provided"
7. If an explanation doesn't exist, leave it blank
8. Copy text EXACTLY with original punctuation and spelling
9. Preserve original formatting and line breaks in dialogues
10. Empty XML tags are preferred over invented content

CONTEXT INFORMATION:
- Grade Level: ${grade} (${gradeGroup === "6-9" ? "Basic-Intermediate" : "Intermediate-Advanced"})
- Unit Title: ${unitTitle}
- Lesson Type: ${lessonType}
- Expected Content: ${lessonConfig.expectedContent.join(', ')}

EXTRACTION INSTRUCTIONS:

1. VOCABULARY EXTRACTION:
   Look for vocabulary in these specific places:
   - Words explicitly in bold (**word**)
   - Words in vocabulary lists or tables
   - Words with definitions provided (word: definition)
   - Words in exercise instructions
   
   For each word, ONLY include:
   - The exact word as written
   - Definition IF provided in text (copy exactly)
   - Vietnamese translation IF provided (usually after "Tạm dịch:" or in parentheses)
   - Examples IF they appear in the text (copy exactly)
   
2. DIALOGUE EXTRACTION:
   Look for conversations marked by:
   - Speaker names followed by colon (Name:)
   - Direct speech in the text
   
   Extract:
   - Speaker names EXACTLY as written
   - Dialogue text VERBATIM (including punctuation)
   - Vietnamese translations ONLY if under "Tạm dịch:" or "Phương pháp giải:"

3. EXERCISE EXTRACTION:
   Look for exercises marked by:
   - "Bài 1", "Bài 2", etc.
   - Numbered questions (1., 2., 3.)
   - Instructions in imperative form
   
   Extract:
   - Instruction text EXACTLY as written
   - Question text VERBATIM
   - Answer options EXACTLY as listed (a), b), c) or A, B, C)
   - Answers ONLY from sections marked:
     * "Lời giải chi tiết:"
     * "Đáp án:"
     * "Answer:"
   - Explanations ONLY from sections marked:
     * "Giải thích:"
     * "Phương pháp giải:"
     * "Explanation:"

4. GRAMMAR EXTRACTION:
   Look for grammar in:
   - Sections titled "Grammar" or "Ngữ pháp"
   - Rule statements with formulas (S + V + O)
   - Example sentences showing grammar usage
   
   Extract ONLY explicitly stated rules and examples

VERIFICATION CHECKLIST:
Before including any content, verify:
☐ Can I point to the EXACT line where this appears?
☐ Am I copying the text EXACTLY as written?
☐ If I can't find it, am I leaving the field empty?
☐ Have I avoided ALL interpretation or creation?

CONTENT TO PROCESS:
${cleanedContent}

RESPONSE FORMAT:
Return ONLY valid XML. Use empty tags for missing content. Never invent content to fill empty tags.

<?xml version="1.0" encoding="UTF-8"?>
<lesson_content type="${lessonType}" grade="${grade}" extraction_mode="strict_verbatim">
  <metadata>
    <extraction_timestamp>${new Date().toISOString()}</extraction_timestamp>
    <source_length>${cleanedContent.length}</source_length>
  </metadata>
  
  <vocabulary_bank>
    <!-- Only vocabulary found in the source -->
    <vocabulary_item id="[word-lowercase-hyphenated]">
      <word>[EXACT word from text]</word>
      <definition>[EXACT definition if provided, empty if not]</definition>
      <translation lang="vi">[EXACT translation if provided, empty if not]</translation>
      <examples>
        <example>[EXACT example sentence if provided]</example>
      </examples>
      <source_location>[Where found: dialogue/exercise/text]</source_location>
    </vocabulary_item>
  </vocabulary_bank>
  
  <dialogues>
    <dialogue id="dialogue-1">
      <participants>[EXACT speaker names from text]</participants>
      <transcript>
        <turn speaker="[EXACT name]">[EXACT speech text]</turn>
      </transcript>
      <translation lang="vi" available="[true/false]">
        <turn speaker="[Name]">[EXACT translation if provided]</turn>
      </translation>
    </dialogue>
  </dialogues>
  
  <exercises>
    <exercise id="[bai-1/ex-1]" type="[actual type]">
      <instruction>[EXACT instruction text]</instruction>
      <instruction_vi>[EXACT Vietnamese if provided]</instruction_vi>
      
      <questions>
        <question number="[EXACT number]">
          <prompt>[EXACT question text]</prompt>
          <options provided="[true/false]">
            <option letter="[EXACT letter]">[EXACT option text]</option>
          </options>
          <answer status="[provided/not_provided]">[EXACT answer if given]</answer>
          <explanation provided="[true/false]">[EXACT explanation if given]</explanation>
        </question>
      </questions>
    </exercise>
  </exercises>
  
  <grammar_points>
    <point>
      <rule>[EXACT grammar rule if stated]</rule>
      <formula>[EXACT formula if provided like S+V+O]</formula>
      <examples>
        <example>[EXACT example if provided]</example>
      </examples>
    </point>
  </grammar_points>
  
  <extraction_summary>
    <dialogues_found>[true/false]</dialogues_found>
    <exercises_found>[true/false]</exercises_found>
    <answers_found>[true/false]</answers_found>
    <vocabulary_count>[number]</vocabulary_count>
  </extraction_summary>
</lesson_content>

FINAL REMINDER:
- Every piece of text in your output MUST exist in the original content
- When in doubt, leave it out
- Empty fields are correct when content doesn't exist
- Your output should be 100% traceable to source text`;
  }
};

// Export for use in other modules
export default PromptLibrary;