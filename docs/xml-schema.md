# XML Schema Documentation for V2 English Learning App

## Overview
This document defines the complete XML schema for structured educational content in the V2 English Learning App. The schema is based on SCORM/LOM standards and optimized for Global Success curriculum grades 6-12.

## Schema Namespace
```xml
xmlns="http://english-learning-app.com/schema/v2"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://english-learning-app.com/schema/v2 schema.xsd"
```

## Root Element Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<curriculum xmlns="http://english-learning-app.com/schema/v2">
  <metadata>
    <title>Global Success English Curriculum</title>
    <version>2.0</version>
    <created_date>2025-08-25</created_date>
    <language>en-vi</language>
    <publisher>English Learning App V2</publisher>
  </metadata>
  <grades>
    <grade level="6" cefr_level="A1">...</grade>
    <grade level="7" cefr_level="A1-A2">...</grade>
    <grade level="8" cefr_level="A2">...</grade>
    <grade level="9" cefr_level="A2-B1">...</grade>
    <grade level="10" cefr_level="B1">...</grade>
    <grade level="11" cefr_level="B1-B2">...</grade>
    <grade level="12" cefr_level="B2">...</grade>
  </grades>
</curriculum>
```

## Grade Level Structure

```xml
<grade level="7" cefr_level="A1-A2">
  <metadata>
    <title>Grade 7 English - Global Success</title>
    <description>Foundational English skills for Grade 7 students</description>
    <total_units>12</total_units>
    <estimated_hours>120</estimated_hours>
  </metadata>
  <units>
    <unit id="unit-01" title="Hobbies" order="1">...</unit>
    <unit id="unit-02" title="Healthy Living" order="2">...</unit>
    <!-- ... up to 12 units -->
  </units>
</grade>
```

## Unit Structure

```xml
<unit id="unit-01" title="Hobbies" order="1">
  <metadata>
    <description>Introduction to hobbies and leisure activities</description>
    <learning_objectives>
      <objective id="obj1" type="vocabulary">Identify and describe personal hobbies</objective>
      <objective id="obj2" type="grammar">Use present simple for habits and routines</objective>
      <objective id="obj3" type="communication">Express preferences and opinions</objective>
    </learning_objectives>
    <estimated_duration>450</estimated_duration> <!-- minutes -->
    <difficulty_progression>1-3</difficulty_progression>
    <vocabulary_count>32</vocabulary_count>
  </metadata>
  
  <vocabulary_bank>...</vocabulary_bank>
  <sections>...</sections>
  <assessments>...</assessments>
</unit>
```

## Vocabulary Bank Structure

```xml
<vocabulary_bank>
  <vocabulary_item id="hobby" frequency="high" cefr="A1" part_of_speech="noun">
    <word>hobby</word>
    <pronunciation>
      <ipa>/ˈhɒbi/</ipa>
      <audio_files>
        <audio accent="british" file="hobby_uk.mp3" duration="1.2"/>
        <audio accent="american" file="hobby_us.mp3" duration="1.1"/>
        <audio accent="australian" file="hobby_au.mp3" duration="1.3"/>
      </audio_files>
    </pronunciation>
    <definition>an activity that you do for pleasure when you are not working</definition>
    <translation lang="vi">sở thích</translation>
    <examples>
      <example difficulty="1">
        <text>My hobby is reading books.</text>
        <translation>Sở thích của tôi là đọc sách.</translation>
      </example>
      <example difficulty="2">
        <text>Building dollhouses is her favorite hobby.</text>
        <translation>Xây nhà búp bê là sở thích yêu thích của cô ấy.</translation>
      </example>
    </examples>
    <collocations>
      <collocation frequency="high">take up a hobby</collocation>
      <collocation frequency="medium">pursue a hobby</collocation>
      <collocation frequency="medium">hobby enthusiast</collocation>
    </collocations>
    <synonyms>
      <synonym cefr="A2">interest</synonym>
      <synonym cefr="B1">pastime</synonym>
      <synonym cefr="B2">pursuit</synonym>
    </synonyms>
    <word_family>
      <related word="hobbyist" pos="noun" cefr="B1"/>
    </word_family>
    <usage_notes>
      <note>Countable noun - can use 'a hobby' or 'hobbies'</note>
      <note>Often followed by gerund: 'My hobby is swimming'</note>
    </usage_notes>
  </vocabulary_item>
  <!-- More vocabulary items... -->
</vocabulary_bank>
```

## Section Structure

```xml
<sections>
  <section id="getting-started" title="Getting Started" order="1" type="introduction">
    <metadata>
      <estimated_duration>45</estimated_duration>
      <skills_focus>listening,speaking,vocabulary</skills_focus>
      <materials_needed>audio_player,vocabulary_cards</materials_needed>
    </metadata>
    
    <learning_content>
      <dialogues>...</dialogues>
      <reading_passages>...</reading_passages>
      <audio_content>...</audio_content>
    </learning_content>
    
    <exercises>...</exercises>
    
    <vocabulary_focus>
      <ref id="hobby"/>
      <ref id="dollhouse"/>
      <ref id="creativity"/>
      <!-- ... -->
    </vocabulary_focus>
  </section>
  <!-- More sections: A Closer Look 1, A Closer Look 2, Communication and Culture, Skills 1, Skills 2, Looking Back & Project -->
</sections>
```

## Dialogue Structure

```xml
<dialogues>
  <dialogue id="dialogue-01" type="casual_conversation">
    <metadata>
      <title>Discussing Hobbies</title>
      <context>Two friends talking about their hobbies at home</context>
      <setting>informal</setting>
      <characters>
        <character name="Ann" role="visitor" age_group="teenager"/>
        <character name="Trang" role="host" age_group="teenager"/>
      </characters>
      <audio_file>dialogues/unit01/conversation01.mp3</audio_file>
      <duration>90</duration> <!-- seconds -->
    </metadata>
    
    <exchanges>
      <exchange id="ex1" speaker="Ann" timestamp="0.0">
        <text>Your house is very nice, Trang.</text>
        <translation>Nhà của bạn rất đẹp, Trang.</translation>
        <pronunciation_guide>/jʊr haʊs ɪz ˈveri naɪs, træŋ/</pronunciation_guide>
        <vocabulary_refs>
          <ref id="house" emphasis="true"/>
          <ref id="nice" emphasis="true"/>
        </vocabulary_refs>
        <grammar_points>
          <point type="adjective_order">very + adjective</point>
          <point type="possessive">your house</point>
        </grammar_points>
        <intonation pattern="falling" emotion="compliment"/>
      </exchange>
      
      <exchange id="ex2" speaker="Trang" timestamp="3.2">
        <text>Thanks! Let's go upstairs. I'll show you my room.</text>
        <translation>Cảm ơn! Hãy đi lên lầu. Mình sẽ cho bạn xem phòng của mình.</translation>
        <pronunciation_guide>/θæŋks! lets ɡoʊ ˌʌpˈsters. aɪl ʃoʊ ju maɪ rum/</pronunciation_guide>
        <vocabulary_refs>
          <ref id="upstairs" emphasis="true"/>
          <ref id="show" emphasis="true"/>
          <ref id="room" emphasis="true"/>
        </vocabulary_refs>
        <grammar_points>
          <point type="suggestion">Let's + base verb</point>
          <point type="future">I'll (contraction)</point>
        </grammar_points>
        <intonation pattern="rising-falling" emotion="friendly"/>
      </exchange>
      <!-- More exchanges... -->
    </exchanges>
    
    <comprehension_questions>
      <question type="factual">Where does the conversation take place?</question>
      <question type="inference">How do Ann and Trang know each other?</question>
    </comprehension_questions>
  </dialogue>
</dialogues>
```

## Exercise Structure (Detailed)

```xml
<exercises>
  <exercise id="ex001" type="multiple_choice" difficulty="2" estimated_time="3" points="10">
    <metadata>
      <title>Dialogue Comprehension</title>
      <instructions>
        <text>Listen to the dialogue and choose the correct answer</text>
        <translation>Nghe đoạn hội thoại và chọn câu trả lời đúng</translation>
      </instructions>
      <prerequisite_vocabulary>
        <ref id="hobby"/>
        <ref id="dollhouse"/>
      </prerequisite_vocabulary>
    </metadata>
    
    <question>
      <text>What are Trang and Ann talking about?</text>
      <translation>Trang và Ann đang nói về điều gì?</translation>
      <audio_cue>audio/questions/unit01_q1.mp3</audio_cue>
    </question>
    
    <options shuffle="true">
      <option id="a" correct="true" points="10">
        <text>Hobbies</text>
        <translation>Sở thích</translation>
        <explanation>The dialogue focuses on their personal hobbies and interests.</explanation>
      </option>
      <option id="b" correct="false" points="0">
        <text>School subjects</text>
        <translation>Các môn học</translation>
        <explanation>They don't discuss school subjects in this conversation.</explanation>
      </option>
      <option id="c" correct="false" points="0">
        <text>Leisure time</text>
        <translation>Thời gian rảnh</translation>
        <explanation>While related, the focus is specifically on hobbies, not general leisure time.</explanation>
      </option>
      <option id="d" correct="false" points="0">
        <text>Weekend plans</text>
        <translation>Kế hoạch cuối tuần</translation>
        <explanation>They mention Sunday but don't discuss weekend plans in general.</explanation>
      </option>
    </options>
    
    <feedback>
      <correct>
        <text>Excellent! You understood the main topic of the conversation.</text>
        <translation>Tuyệt vời! Bạn đã hiểu chủ đề chính của cuộc hội thoại.</translation>
        <next_steps>Try the vocabulary matching exercise next.</next_steps>
      </correct>
      <incorrect>
        <text>Not quite right. Listen again and focus on what activities they discuss.</text>
        <translation>Chưa đúng. Hãy nghe lại và chú ý đến những hoạt động họ thảo luận.</translation>
        <hint>Pay attention to words like "dollhouse" and "horse riding"</hint>
      </incorrect>
    </feedback>
    
    <learning_analytics>
      <track_metrics>response_time,attempts,hint_usage</track_metrics>
      <difficulty_adjustment enabled="true"/>
    </learning_analytics>
  </exercise>
  
  <!-- Fill in the blanks example -->
  <exercise id="ex002" type="fill_in_blanks" difficulty="3" estimated_time="5" points="20">
    <metadata>
      <title>Complete the Dialogue</title>
      <instructions>
        <text>Fill in the missing words from the conversation</text>
        <translation>Điền vào chỗ trống những từ còn thiếu trong cuộc hội thoại</translation>
      </instructions>
    </metadata>
    
    <content>
      <sentences>
        <sentence id="s1">
          <text>My _______ is building dollhouses.</text>
          <translation>_______ của tôi là xây nhà búp bê.</translation>
          <blanks>
            <blank position="1" id="blank1">
              <answers>
                <answer primary="true" points="5">hobby</answer>
                <answer alternative="true" points="4">interest</answer>
                <answer alternative="true" points="3">pastime</answer>
              </answers>
              <hints>
                <hint level="1">This word means an activity you do for fun</hint>
                <hint level="2">It starts with 'h' and rhymes with 'lobby'</hint>
              </hints>
              <vocabulary_ref id="hobby"/>
            </blank>
          </blanks>
        </sentence>
        
        <sentence id="s2">
          <text>All you need is some _______ and glue.</text>
          <translation>Tất cả những gì bạn cần là một ít _______ và keo.</translation>
          <blanks>
            <blank position="1" id="blank2">
              <answers>
                <answer primary="true" points="5">cardboard</answer>
                <answer alternative="true" points="3">paper</answer>
              </answers>
              <vocabulary_ref id="cardboard"/>
            </blank>
          </blanks>
        </sentence>
      </sentences>
      
      <word_bank mode="optional" shuffle="true">
        <word>hobby</word>
        <word>cardboard</word>
        <word>creativity</word>
        <word>unusual</word>
        <word>common</word>
      </word_bank>
    </content>
    
    <validation>
      <case_sensitive>false</case_sensitive>
      <ignore_articles>true</ignore_articles>
      <accept_contractions>true</accept_contractions>
    </validation>
  </exercise>
</exercises>
```

## Grammar Focus Structure

```xml
<grammar_focus>
  <topic id="present-simple-hobbies" level="A1">
    <title>Present Simple for Hobbies and Routines</title>
    <explanation>
      <text>We use the present simple to talk about habits, routines, and things that are generally true.</text>
      <translation>Chúng ta sử dụng thì hiện tại đơn để nói về thói quen, hoạt động hàng ngày và những điều thường đúng.</translation>
    </explanation>
    
    <rules>
      <rule id="rule1" importance="high">
        <pattern>Subject + verb (base form) + object</pattern>
        <description>For I, you, we, they</description>
        <examples>
          <example>
            <sentence>I play guitar every day.</sentence>
            <breakdown>
              <subject>I</subject>
              <verb>play</verb>
              <object>guitar</object>
              <adverbial>every day</adverbial>
            </breakdown>
          </example>
        </examples>
      </rule>
      
      <rule id="rule2" importance="high">
        <pattern>Subject + verb + s/es + object</pattern>
        <description>For he, she, it (third person singular)</description>
        <examples>
          <example>
            <sentence>She collects stamps.</sentence>
            <breakdown>
              <subject>She</subject>
              <verb>collects</verb>
              <object>stamps</object>
            </breakdown>
          </example>
        </examples>
      </rule>
    </rules>
    
    <common_errors>
      <error type="missing_s">
        <incorrect>He play guitar.</incorrect>
        <correct>He plays guitar.</correct>
        <explanation>Don't forget 's' for third person singular</explanation>
      </error>
    </common_errors>
    
    <practice_exercises>
      <ref exercise_id="grammar_ex001"/>
      <ref exercise_id="grammar_ex002"/>
    </practice_exercises>
  </topic>
</grammar_focus>
```

## Assessment Structure

```xml
<assessments>
  <assessment id="unit-test-01" type="unit_test" mode="formative">
    <metadata>
      <title>Unit 1 Assessment: Hobbies</title>
      <description>Comprehensive assessment of Unit 1 learning objectives</description>
      <duration>30</duration> <!-- minutes -->
      <total_points>100</total_points>
      <passing_score>70</passing_score>
      <attempts_allowed>2</attempts_allowed>
      <randomize_questions>true</randomize_questions>
    </metadata>
    
    <test_sections>
      <test_section id="listening" title="Listening Comprehension" points="25" time_limit="10">
        <instructions>
          <text>Listen to each audio clip and answer the questions</text>
          <translation>Nghe từng đoạn âm thanh và trả lời câu hỏi</translation>
        </instructions>
        <exercise_refs>
          <ref id="listening_ex001" weight="40"/>
          <ref id="listening_ex002" weight="35"/>
          <ref id="listening_ex003" weight="25"/>
        </exercise_refs>
      </test_section>
      
      <test_section id="vocabulary" title="Vocabulary" points="30" time_limit="8">
        <exercise_refs>
          <ref id="vocab_ex001" weight="50"/>
          <ref id="vocab_ex002" weight="50"/>
        </exercise_refs>
      </test_section>
      
      <test_section id="grammar" title="Grammar" points="25" time_limit="7">
        <exercise_refs>
          <ref id="grammar_ex001" weight="60"/>
          <ref id="grammar_ex002" weight="40"/>
        </exercise_refs>
      </test_section>
      
      <test_section id="writing" title="Writing" points="20" time_limit="5">
        <exercise_refs>
          <ref id="writing_ex001" weight="100"/>
        </exercise_refs>
      </test_section>
    </test_sections>
    
    <grading_criteria>
      <criterion category="vocabulary" weight="30"/>
      <criterion category="grammar" weight="25"/>
      <criterion category="comprehension" weight="25"/>
      <criterion category="communication" weight="20"/>
    </grading_criteria>
    
    <feedback_rules>
      <rule score_range="90-100">
        <message>Excellent work! You have mastered this unit.</message>
        <recommendation>Move on to the next unit with confidence.</recommendation>
      </rule>
      <rule score_range="70-89">
        <message>Good job! You understand most concepts.</message>
        <recommendation>Review the areas where you lost points.</recommendation>
      </rule>
      <rule score_range="0-69">
        <message>You need more practice with this unit.</message>
        <recommendation>Study the vocabulary and grammar sections again.</recommendation>
      </rule>
    </feedback_rules>
  </assessment>
</assessments>
```

## Media and Assets Structure

```xml
<media_assets>
  <audio_files>
    <file id="dialogue01" 
          path="audio/unit01/dialogue01.mp3" 
          duration="90" 
          format="mp3" 
          bitrate="128kbps"
          speakers="2"
          transcript_available="true"/>
    <file id="vocab_hobby_uk" 
          path="audio/vocab/hobby_uk.mp3" 
          duration="1.2" 
          accent="british"
          speaker_gender="female"/>
  </audio_files>
  
  <image_files>
    <file id="dollhouse_img" 
          path="images/unit01/dollhouse.jpg" 
          alt_text="A colorful wooden dollhouse" 
          width="800" 
          height="600"/>
    <file id="horse_riding_img" 
          path="images/unit01/horse_riding.jpg" 
          alt_text="A person riding a horse" 
          width="800" 
          height="600"/>
  </image_files>
  
  <video_files>
    <file id="pronunciation_demo" 
          path="videos/unit01/pronunciation.mp4" 
          duration="45" 
          subtitles_available="true"
          quality="720p"/>
  </video_files>
</media_assets>
```

## Validation Schema (XSD)

```xsd
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="http://english-learning-app.com/schema/v2"
           xmlns="http://english-learning-app.com/schema/v2"
           elementFormDefault="qualified">

  <!-- Root Element -->
  <xs:element name="curriculum" type="CurriculumType"/>
  
  <!-- Complex Types -->
  <xs:complexType name="CurriculumType">
    <xs:sequence>
      <xs:element name="metadata" type="MetadataType"/>
      <xs:element name="grades" type="GradesType"/>
    </xs:sequence>
  </xs:complexType>
  
  <xs:complexType name="GradeType">
    <xs:sequence>
      <xs:element name="metadata" type="GradeMetadataType"/>
      <xs:element name="units" type="UnitsType"/>
    </xs:sequence>
    <xs:attribute name="level" type="xs:int" use="required"/>
    <xs:attribute name="cefr_level" type="CEFRLevelType" use="required"/>
  </xs:complexType>
  
  <!-- Simple Types -->
  <xs:simpleType name="CEFRLevelType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="A1"/>
      <xs:enumeration value="A1-A2"/>
      <xs:enumeration value="A2"/>
      <xs:enumeration value="A2-B1"/>
      <xs:enumeration value="B1"/>
      <xs:enumeration value="B1-B2"/>
      <xs:enumeration value="B2"/>
      <xs:enumeration value="C1"/>
      <xs:enumeration value="C2"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:simpleType name="ExerciseType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="multiple_choice"/>
      <xs:enumeration value="true_false"/>
      <xs:enumeration value="fill_in_blanks"/>
      <xs:enumeration value="vocabulary_matching"/>
      <xs:enumeration value="listening_comprehension"/>
      <xs:enumeration value="grammar_transformation"/>
      <xs:enumeration value="pronunciation_practice"/>
      <!-- Add more exercise types as defined in exercise-types.md -->
    </xs:restriction>
  </xs:simpleType>
  
  <xs:simpleType name="DifficultyType">
    <xs:restriction base="xs:int">
      <xs:minInclusive value="1"/>
      <xs:maxInclusive value="6"/>
    </xs:restriction>
  </xs:simpleType>
  
  <!-- More type definitions... -->
</xs:schema>
```

## TypeScript Interface Definitions

```typescript
// Auto-generated from XML Schema
interface Curriculum {
  metadata: CurriculumMetadata;
  grades: Grade[];
}

interface Grade {
  level: number;
  cefr_level: CEFRLevel;
  metadata: GradeMetadata;
  units: Unit[];
}

interface Unit {
  id: string;
  title: string;
  order: number;
  metadata: UnitMetadata;
  vocabulary_bank: VocabularyItem[];
  sections: Section[];
  assessments: Assessment[];
}

interface VocabularyItem {
  id: string;
  word: string;
  pronunciation: Pronunciation;
  definition: string;
  translation: string;
  examples: Example[];
  collocations: string[];
  synonyms: Synonym[];
  word_family: RelatedWord[];
  usage_notes: string[];
  frequency: 'high' | 'medium' | 'low';
  cefr: CEFRLevel;
  part_of_speech: PartOfSpeech;
}

interface Exercise {
  id: string;
  type: ExerciseType;
  difficulty: DifficultyLevel;
  estimated_time: number;
  points: number;
  metadata: ExerciseMetadata;
  question: Question;
  validation: ValidationRules;
  learning_analytics: AnalyticsConfig;
}

type ExerciseType = 
  | 'multiple_choice'
  | 'true_false'
  | 'fill_in_blanks'
  | 'vocabulary_matching'
  | 'listening_comprehension'
  | 'grammar_transformation'
  | 'pronunciation_practice';

type CEFRLevel = 'A1' | 'A1-A2' | 'A2' | 'A2-B1' | 'B1' | 'B1-B2' | 'B2' | 'C1' | 'C2';

type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6;
```

## Conversion Tools

The XML schema includes tools for converting existing markdown content:

1. **Markdown Parser**: Extracts vocabulary, dialogues, and exercises from existing .md files
2. **AI Content Processor**: Uses Claude/Gemini to structure unformatted content
3. **Validation Tool**: Ensures XML conforms to schema and business rules
4. **Migration Script**: Bulk converts existing content library

## Best Practices

1. **Unique IDs**: All elements must have unique, descriptive IDs
2. **Internationalization**: Support for multiple languages (en, vi, etc.)
3. **Accessibility**: ARIA labels and semantic markup
4. **Performance**: Lazy loading for media assets
5. **Validation**: Real-time schema validation during content creation
6. **Version Control**: Track changes to content with metadata timestamps