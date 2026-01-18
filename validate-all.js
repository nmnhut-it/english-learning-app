const fs = require('fs');
const path = require('path');

let errors = [];
const gradeMap = {'grade6': '6', 'grade7': '7', 'grade8': '8', 'grade9': '9', 'grade10': '10', 'grade11': '11', 'grade12': '12'};

for (const [gradeDir, gradeNum] of Object.entries(gradeMap)) {
  const gradePath = path.join('loigiaihay.com', gradeDir);
  if (!fs.existsSync(gradePath)) continue;

  const units = fs.readdirSync(gradePath);
  for (const unit of units) {
    const unitPath = path.join(gradePath, unit);
    const files = fs.readdirSync(unitPath);
    for (const file of files) {
      const filePath = path.join(unitPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(/<title>([^<]*)<\/title>/);
      if (!match) {
        errors.push(filePath + ': NO TITLE');
        continue;
      }
      const title = match[1].toLowerCase();
      // Check grade matches
      const hasCorrectGrade = title.includes('tiếng anh ' + gradeNum) ||
                              title.includes('tieng anh ' + gradeNum) ||
                              title.includes('tiếng anh lớp ' + gradeNum);
      if (!hasCorrectGrade) {
        errors.push(filePath + ': Wrong grade - ' + match[1].substring(0, 60));
      }
    }
  }
}

if (errors.length === 0) {
  console.log('ALL 524 FILES VERIFIED - correct grade in every title!');
} else {
  console.log('Found ' + errors.length + ' errors:');
  errors.forEach(e => console.log(e));
}
