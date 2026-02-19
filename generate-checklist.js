/**
 * Generate a review checklist from fabrication check summary files.
 * Extracts CRITICAL and HIGH issues for manual review.
 */
const fs = require('fs');
const path = require('path');

const GRADES = [6, 7, 8, 9];
const OUTPUT_FILE = path.join(__dirname, 'fabrication-review-checklist.md');

function parseFabFile(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Parse checking lines and their issues
  const lines = content.split('\n');
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match: Checking: G6 U01 getting-started
    const checkMatch = line.match(/Checking: G(\d+) U(\d+) ([\w-]+)/);
    if (checkMatch) {
      currentSection = {
        grade: checkMatch[1],
        unit: checkMatch[2],
        section: checkMatch[3],
        issues: []
      };
      continue;
    }

    // Match severity lines: 🔴 CRITICAL (1) or 🟠 HIGH (2)
    const criticalMatch = line.match(/🔴 CRITICAL \((\d+)\)/);
    const highMatch = line.match(/🟠 HIGH \((\d+)\)/);

    if ((criticalMatch || highMatch) && currentSection) {
      const severity = criticalMatch ? 'CRITICAL' : 'HIGH';
      const count = parseInt(criticalMatch?.[1] || highMatch?.[1]);

      // Get the detail lines that follow (indented with spaces)
      for (let j = i + 1; j < lines.length && j < i + count + 1; j++) {
        const detailLine = lines[j];
        if (detailLine.startsWith('     ')) {
          currentSection.issues.push({
            severity,
            detail: detailLine.trim()
          });
        } else {
          break;
        }
      }

      if (currentSection.issues.length > 0) {
        issues.push({ ...currentSection });
        currentSection = { ...currentSection, issues: [] };
      }
    }
  }

  return issues;
}

function main() {
  let checklist = '# Fabrication Review Checklist\n\n';
  checklist += `Generated: ${new Date().toISOString()}\n\n`;
  checklist += '## Legend\n';
  checklist += '- [ ] = Pending review\n';
  checklist += '- [x] = Reviewed and fixed\n';
  checklist += '- [W] = Whitelisted (false positive)\n';
  checklist += '- [S] = Skipped (audio file issue)\n\n';

  let totalIssues = 0;

  for (const grade of GRADES) {
    const fabFile = path.join(__dirname, `fab-g${grade}.txt`);
    const issues = parseFabFile(fabFile);

    if (issues.length === 0) continue;

    checklist += `## Grade ${grade}\n\n`;

    for (const item of issues) {
      for (const issue of item.issues) {
        totalIssues++;
        const key = `g${item.grade}-unit-${item.unit}-${item.section}`;
        const emoji = issue.severity === 'CRITICAL' ? '🔴' : '🟠';
        checklist += `- [ ] ${emoji} **${key}**: ${issue.detail}\n`;
      }
    }
    checklist += '\n';
  }

  checklist += `---\n**Total issues: ${totalIssues}**\n`;

  fs.writeFileSync(OUTPUT_FILE, checklist);
  console.log(`Checklist generated: ${OUTPUT_FILE}`);
  console.log(`Total issues to review: ${totalIssues}`);
}

main();
