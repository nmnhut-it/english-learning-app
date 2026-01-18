const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_LOIGIAIHAY = path.join(__dirname, 'loigiaihay.com');
const SOURCE_MARKDOWN = path.join(__dirname, 'markdown-files');
const DEST_ROOT = path.join(__dirname, 'v2/data/voice-lectures');
const STANDARD_SCRIPTS_PATH = path.join(DEST_ROOT, 'standard_scripts.json');

const STANDARD_SCRIPTS = JSON.parse(fs.readFileSync(STANDARD_SCRIPTS_PATH, 'utf-8'));

const GRADES = ['g6', 'g7', 'g8', 'g9'];
const UNITS = Array.from({ length: 12 }, (_, i) => `unit-${(i + 1).toString().padStart(2, '0')}`);
const SECTIONS = [
    'getting-started',
    'a-closer-look-1',
    'a-closer-look-2',
    'communication',
    'skills-1',
    'skills-2',
    'looking-back'
];

function getAudioUrl(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/\[🔊 Audio\]\((https?:\/\/img\.loigiaihay\.com\/[^)]+)\)/);
    return match ? match[1] : null;
}

function getMarkdownContent(grade, unit, section) {
    let markdownGradeDir;
    if (grade === 'g6') {
        markdownGradeDir = path.join(SOURCE_MARKDOWN, 'formatg6');
    } else {
        markdownGradeDir = path.join(SOURCE_MARKDOWN, grade);
    }

    const uNum = unit.split('-')[1];
    const gNum = grade[1];
    const filename = `g${gNum}_u${uNum}_${section}.md`;
    const mdPath = path.join(markdownGradeDir, unit, filename);

    if (fs.existsSync(mdPath)) {
        return fs.readFileSync(mdPath, 'utf-8');
    }
    return null;
}

function standardizeContent(grade, unit, section, audioUrl, rawMd) {
    const title = `# ${grade.toUpperCase()} ${unit.toUpperCase()} ${section.replace(/-/g, ' ').toUpperCase()}`;

    let output = [];
    output.push(title);
    output.push("");
    output.push("<!-- chunk: intro -->");
    output.push("<teacher_script pause=\"0\">");
    output.push(STANDARD_SCRIPTS['intro_generic']);
    output.push("</teacher_script>");
    output.push("");

    // 1. Heuristic Vocabulary detection (Should come BEFORE Audio in most lessons)
    const vocabRegex = /\*\*Vocabulary\*\*(?:[\s\S]*?)(?=\*\*Bài|\*\*Exercise|##|Giáo viên:|Phong:|Ann:|Trang:|Tom:|Trang:|$)/i;
    const vocabMatch = rawMd.match(vocabRegex);

    let cleanMd = rawMd;
    if (vocabMatch) {
        const vocabText = vocabMatch[0];
        output.push("<!-- chunk: vocabulary -->");
        output.push("<teacher_script pause=\"0\">");
        output.push(STANDARD_SCRIPTS['vocab_intro']);
        output.push("</teacher_script>");
        output.push("");
        output.push("<vocabulary>");

        const lines = vocabText.split('\n');
        lines.forEach(line => {
            const trimmed = line.trim();
            // Match numbered list or asterisk
            if (/^\d+\./.test(trimmed) || trimmed.startsWith('*')) {
                output.push(trimmed);
            }
        });
        output.push("</vocabulary>");
        output.push("");
        cleanMd = cleanMd.replace(vocabText, "");
    }

    // 2. Audio Injection (After vocabulary, before main content/listening)
    if (audioUrl) {
        output.push("<!-- chunk: audio -->");
        output.push("<teacher_script pause=\"0\">");
        output.push(STANDARD_SCRIPTS['listening_intro']);
        output.push("</teacher_script>");
        output.push("");
        output.push(`<audio src="${audioUrl}">`);
        output.push(`**Audio:** ${section.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}`);
        output.push("</audio>");
        output.push("");
    }

    // 3. Main Content
    output.push("<!-- chunk: content -->");
    output.push("<teacher_script pause=\"0\">");
    output.push(STANDARD_SCRIPTS['activity_generic']);
    output.push("</teacher_script>");
    output.push("");

    output.push(cleanMd.trim());
    output.push("");

    // 4. End
    output.push("<!-- chunk: end -->");
    output.push("<teacher_script pause=\"0\">");
    output.push(STANDARD_SCRIPTS['outro_generic']);
    output.push("</teacher_script>");

    return output.join("\n");
}

function main() {
    GRADES.forEach(grade => {
        UNITS.forEach(unit => {
            SECTIONS.forEach(section => {
                const loigiaihayPath = path.join(SOURCE_LOIGIAIHAY, `grade${grade[1]}`, unit, `${section}.md`);
                const audioUrl = getAudioUrl(loigiaihayPath);

                const rawMd = getMarkdownContent(grade, unit, section);
                if (!rawMd) return;

                const finalMd = standardizeContent(grade, unit, section, audioUrl, rawMd);

                const safeDestDir = path.join(DEST_ROOT, 'bulk_generated', grade, unit);
                if (!fs.existsSync(safeDestDir)) {
                    fs.mkdirSync(safeDestDir, { recursive: true });
                }

                const safeDestPath = path.join(safeDestDir, `${section}.md`);
                fs.writeFileSync(safeDestPath, finalMd, 'utf-8');
                console.log(`Generated: ${path.relative(__dirname, safeDestPath)}`);
            });
        });
    });
}

main();
