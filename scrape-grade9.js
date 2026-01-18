const { chromium } = require('playwright');
const fs = require('fs');

// Grade 9 URLs for units 1-7 (units 8-12 already scraped)
const units = {
  '1': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-9-unit-1-getting-started-a155966.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-9-unit-1-a-closer-look-1-a156607.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-9-unit-1-a-closer-look-2-a156613.html',
    'communication': 'https://loigiaihay.com/tieng-anh-9-unit-1-communication-a156621.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-9-unit-1-skills-1-a156622.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-9-unit-1-skills-2-a156628.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-9-unit-1-looking-back-a156633.html'
  },
  '2': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-9-unit-2-getting-started-a156653.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-9-unit-2-a-closer-look-1-a156654.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-9-unit-2-a-closer-look-2-a156659.html',
    'communication': 'https://loigiaihay.com/tieng-anh-9-unit-2-communication-a156721.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-9-unit-2-skills-1-a156732.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-9-unit-2-skills-2-a156636.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-9-unit-2-looking-back-a156639.html'
  },
  '3': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-9-unit-3-getting-started-a156735.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-9-unit-3-a-closer-look-1-a156752.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-9-unit-3-a-closer-look-2-a156765.html',
    'communication': 'https://loigiaihay.com/tieng-anh-9-unit-3-communication-a156767.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-9-unit-3-skills-1-a156773.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-9-unit-3-skills-2-a156776.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-9-unit-3-looking-back-a156780.html'
  },
  '4': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-9-unit-4-getting-started-a156823.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-9-unit-4-a-closer-look-1-a156828.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-9-unit-4-a-closer-look-2-a156831.html',
    'communication': 'https://loigiaihay.com/tieng-anh-9-unit-4-communication-a156832.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-9-unit-4-skills-1-a156833.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-9-unit-4-skills-2-a156835.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-9-unit-4-looking-back-a156840.html'
  },
  '5': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-9-unit-5-getting-started-a156847.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-9-unit-5-a-closer-look-1-a156849.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-9-unit-5-a-closer-look-2-a156853.html',
    'communication': 'https://loigiaihay.com/tieng-anh-9-unit-5-a-communication-a156862.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-9-unit-5-skills-1-a156876.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-9-unit-5-skills-2-a156887.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-9-unit-5-looking-back-a156891.html'
  },
  '6': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-9-unit-6-getting-started-a156899.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-9-unit-6-a-closer-look-1-a156901.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-9-unit-6-a-closer-look-2-a156906.html',
    'communication': 'https://loigiaihay.com/tieng-anh-9-unit-6-communication-a156907.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-9-unit-6-skills-1-a156908.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-9-unit-6-skills-2-a156909.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-9-unit-6-looking-back-a156925.html'
  },
  '7': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-9-unit-7-getting-started-a163685.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-9-unit-7-a-closer-look-1-a163686.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-9-unit-7-a-closer-look-2-a163687.html',
    'communication': 'https://loigiaihay.com/tieng-anh-9-unit-7-communication-a163688.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-9-unit-7-skills-1-a163689.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-9-unit-7-skills-2-a163690.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-9-unit-7-looking-back-a163691.html'
  }
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let successCount = 0;
  let errorCount = 0;

  for (const [unitNum, sections] of Object.entries(units)) {
    const unit = `unit-${unitNum.padStart(2, '0')}`;
    const dir = `loigiaihay.com/grade9/${unit}`;
    fs.mkdirSync(dir, { recursive: true });

    for (const [section, url] of Object.entries(sections)) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const html = await page.content();
        fs.writeFileSync(`${dir}/${section}.html`, html);
        console.log(`OK: ${unit}/${section}`);
        successCount++;
      } catch (e) {
        console.log(`ERR: ${unit}/${section} - ${e.message.split('\n')[0]}`);
        errorCount++;
      }
    }
  }

  await browser.close();
  console.log(`\nDone! Success: ${successCount}, Errors: ${errorCount}`);
})();
