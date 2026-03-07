const { chromium } = require('playwright');
const fs = require('fs');

// Grade 8 URLs - Global Success curriculum
const units = {
  '1': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-1-getting-started-a134902.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-1-a-closer-look-1-a134908.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-1-a-closer-look-2-a134917.html',
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-1-communication-a134919.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-1-skills-1-a134921.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-1-skills-2-a134923.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-1-looking-back-a134925.html'
  },
  '2': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-2-getting-started-a137235.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-2-a-closer-look-1-a137239.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-2-a-closer-look-2-a137240.html',
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-2-communication-a137247.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-2-skills-1-a137285.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-2-skills-2-a137295.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-2-looking-back-a137303.html'
  },
  '3': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-3-getting-started-a137312.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-3-a-closer-look-1-a137313.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-3-a-closer-look-2-a137316.html',
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-3-communication-a137318.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-3-skills-1-a137328.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-3-skills-2-a137331.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-3-looking-back-a137335.html'
  },
  '4': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-4-getting-started-a137467.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-4-a-closer-look-1-a137477.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-4-a-closer-look-2-a137483.html',
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-4-communication-a137490.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-4-skills-1-a137491.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-4-skills-2-a137492.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-4-looking-back-a137496.html'
  },
  '5': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-5-getting-started-a137503.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-5-a-closer-look-1-a137509.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-5-a-closer-look-2-a137511.html',
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-5-communication-a137519.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-5-skills-1-a137520.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-5-skills-2-a141799.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-5-looking-back-a141818.html'
  },
  '6': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-6-getting-started-a137527.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-6-a-closer-look-1-a137529.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-6-a-closer-look-2-a137536.html',
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-6-communication-a137544.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-6-skills-1-a137549.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-6-skills-2-a137552.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-6-looking-back-a137559.html'
  },
  '7': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-7-getting-started-a141320.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-7-a-closer-look-1-a141322.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-7-a-closer-look-2-a141329.html',
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-7-communication-a141332.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-7-skills-1-a141333.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-7-skills-2-a141336.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-7-looking-back-a141340.html'
  },
  '8': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-8-getting-started-a141846.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-8-a-closer-look-1-a141847.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-8-a-closer-look-2-a141856.html',
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-8-communication-a141870.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-8-skills-1-a141874.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-8-skills-2-a142616.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-8-looking-back-a142626.html'
  },
  '9': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-9-getting-started-a142630.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-9-a-closer-look-1-a142631.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-9-a-closer-look-2-a142632.html',
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-9-communication-a142633.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-9-skills-1-a142634.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-9-skills-2-a142642.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-9-looking-back-a142648.html'
  },
  '10': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-10-getting-started-a142709.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-10-a-closer-look-1-a142713.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-10-a-closer-look-2-a142714.html',
    // Note: URL has typo "commmunication" (3 m's) on the site
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-10-commmunication-a142717.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-10-skills-1-a142719.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-10-skills-2-a142720.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-10-looking-back-a142723.html'
  },
  '11': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-11-getting-started-a142738.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-11-a-closer-look-1-a142752.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-11-a-closer-look-2-a142753.html',
    // Note: URL has typo "commmunication" (3 m's) on the site
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-11-commmunication-a142754.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-11-skills-1-a142755.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-11-skills-2-a142756.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-11-looking-back-a142765.html'
  },
  '12': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-8-unit-12-getting-started-a142767.html',
    'a-closer-look-1': 'https://loigiaihay.com/tieng-anh-8-unit-12-a-closer-look-1-a142769.html',
    'a-closer-look-2': 'https://loigiaihay.com/tieng-anh-8-unit-12-a-closer-look-2-a142770.html',
    // Note: URL has typo "commmunication" (3 m's) on the site
    'communication': 'https://loigiaihay.com/tieng-anh-8-unit-12-commmunication-a142771.html',
    'skills-1': 'https://loigiaihay.com/tieng-anh-8-unit-12-skills-1-a142851.html',
    'skills-2': 'https://loigiaihay.com/tieng-anh-8-unit-12-skills-2-a142860.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-8-unit-12-looking-back-a142867.html'
  }
};

// Reviews: 4 reviews x 2 sections (language + skills)
const reviews = {
  '1': {
    'language': 'https://loigiaihay.com/tieng-anh-8-review-1-language-a137341.html',
    'skills': 'https://loigiaihay.com/tieng-anh-8-review-1-skills-a137459.html'
  },
  '2': {
    'language': 'https://loigiaihay.com/tieng-anh-8-review-2-language-a137570.html',
    'skills': 'https://loigiaihay.com/tieng-anh-8-review-2-skills-a137573.html'
  },
  '3': {
    'language': 'https://loigiaihay.com/tieng-anh-8-review-3-language-a142660.html',
    'skills': 'https://loigiaihay.com/tieng-anh-8-review-3-skills-a142701.html'
  },
  '4': {
    'language': 'https://loigiaihay.com/tieng-anh-8-review-4-language-a142882.html',
    'skills': 'https://loigiaihay.com/tieng-anh-8-review-4-skills-a142883.html'
  }
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let successCount = 0;
  let errorCount = 0;

  // Scrape units
  for (const [unitNum, sections] of Object.entries(units)) {
    const unit = `unit-${unitNum.padStart(2, '0')}`;
    const dir = `loigiaihay.com/grade8/${unit}`;
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

  // Scrape reviews
  for (const [reviewNum, sections] of Object.entries(reviews)) {
    const review = `review-${reviewNum}`;
    const dir = `loigiaihay.com/grade8/${review}`;
    fs.mkdirSync(dir, { recursive: true });

    for (const [section, url] of Object.entries(sections)) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const html = await page.content();
        fs.writeFileSync(`${dir}/${section}.html`, html);
        console.log(`OK: ${review}/${section}`);
        successCount++;
      } catch (e) {
        console.log(`ERR: ${review}/${section} - ${e.message.split('\n')[0]}`);
        errorCount++;
      }
    }
  }

  await browser.close();
  console.log(`\nDone! Success: ${successCount}, Errors: ${errorCount}`);
})();
