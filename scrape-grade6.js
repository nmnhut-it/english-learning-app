const { chromium } = require('playwright');
const fs = require('fs');

// Grade 6 URLs - pattern is different: {section}-trang-{page}-unit-{unit}-sgk-tieng-anh-6-moi-{id}.html
const units = {
  '1': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-6-unit-1-sgk-tieng-anh-6-moi-a21998.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-8-unit-1-tieng-anh-6-global-success-pearson-a21999.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-9-unit-1-sgk-tieng-anh-6-moi-a22000.html',
    'communication': 'https://loigiaihay.com/communication-trang-11-unit-1-sgk-tieng-anh-6-moi-a22001.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-12-unit-1-sgk-tieng-anh-6-moi-a22002.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-13-unit-1-sgk-tieng-anh-6-moi-a22004.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-14-unit-1-sgk-tieng-anh-6-moi-a22005.html'
  },
  '2': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-16-unit-2-sgk-tieng-anh-6-moi-a22007.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-18-unit-2-sgk-tieng-anh-6-moi-a22008.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-19-unit-2-sgk-tieng-anh-6-moi-a22012.html',
    'communication': 'https://loigiaihay.com/communication-trang-20-unit-2-sgk-tieng-anh-6-moi-a22013.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-22-unit-2-sgk-tieng-anh-6-moi-a22014.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-23-unit-2-sgk-tieng-anh-6-moi-a22015.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-24-unit-2-sgk-tieng-anh-6-moi-a22017.html'
  },
  '3': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-26-unit-3-sgk-tieng-anh-6-moi-a22022.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-28-unit-3-sgk-tieng-anh-6-moi-a22023.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-29-unit-3-sgk-tieng-anh-6-moi-a22024.html',
    'communication': 'https://loigiaihay.com/communication-trang-30-unit-3-sgk-tieng-anh-6-moi-a22025.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-32-unit-3-sgk-tieng-anh-6-moi-a22040.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-33-unit-3-sgk-tieng-anh-6-moi-a22041.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-34-unit-3-sgk-tieng-anh-6-moi-a22043.html'
  },
  '4': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-38-unit-4-sgk-tieng-anh-6-moi-a22068.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-40-unit-4-sgk-tieng-anh-6-moi-a22077.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-41-unit-4-sgk-tieng-anh-6-moi-a22078.html',
    'communication': 'https://loigiaihay.com/communication-trang-43-unit-4-sgk-tieng-anh-6-moi-a22079.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-44-unit-4-sgk-tieng-anh-6-moi-a22080.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-45-unit-4-sgk-tieng-anh-6-moi-a22090.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-46-unit-4-sgk-tieng-anh-6-moi-a22091.html'
  },
  '5': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-48-unit-5-sgk-tieng-anh-6-moi-a22096.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-50-unit-5-sgk-tieng-anh-6-moi-a22100.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-51-unit-5-sgk-tieng-anh-6-moi-a22101.html',
    'communication': 'https://loigiaihay.com/communication-trang-53-unit-5-sgk-tieng-anh-6-moi-a22102.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-54-unit-5-sgk-tieng-anh-6-moi-a22105.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-55-unit-5-sgk-tieng-anh-6-moi-a22106.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-56-unit-5-sgk-tieng-anh-6-moi-a22107.html'
  },
  '6': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-58-unit-6-sgk-tieng-anh-6-moi-a22118.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-60-unit-6-sgk-tieng-anh-6-moi-a22120.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-61-unit-6-sgk-tieng-anh-6-moi-a22131.html',
    'communication': 'https://loigiaihay.com/communication-trang-63-unit-6-sgk-tieng-anh-6-moi-a22133.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-64-unit-6-sgk-tieng-anh-6-moi-a22136.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-65-unit-6-sgk-tieng-anh-6-moi-a22137.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-66-unit-6-sgk-tieng-anh-6-moi-a22138.html'
  },
  '7': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-6-unit-7-sgk-tieng-anh-6-moi-a22501.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-8-unit-7-sgk-tieng-anh-6-moi-a22502.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-9-unit-7-sgk-tieng-anh-6-moi-a22505.html',
    'communication': 'https://loigiaihay.com/communication-trang-11-unit-7-sgk-tieng-anh-6-moi-a22506.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-12-unit-7-sgk-tieng-anh-6-moi-a22507.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-13-unit-7-sgk-tieng-anh-6-moi-a22508.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-14-unit-7-sgk-tieng-anh-6-moi-a22509.html'
  },
  '8': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-16-unit-8-sgk-tieng-anh-6-moi-a22514.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-18-unit-8-sgk-tieng-anh-6-moi-a22515.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-19-unit-8-sgk-tieng-anh-6-moi-a22516.html',
    'communication': 'https://loigiaihay.com/communication-trang-21-unit-8-sgk-tieng-anh-6-moi-a22517.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-22-unit-8-sgk-tieng-anh-6-moi-a22518.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-23-unit-8-sgk-tieng-anh-6-moi-a22519.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-24-unit-8-sgk-tieng-anh-6-moi-a22520.html'
  },
  '9': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-26-unit-9-sgk-tieng-anh-6-moi-a22525.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-28-unit-9-sgk-tieng-anh-6-moi-a22526.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-29-unit-9-sgk-tieng-anh-6-moi-a22527.html',
    'communication': 'https://loigiaihay.com/communication-trang-31-unit-9-sgk-tieng-anh-6-moi-a22528.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-32-unit-9-sgk-tieng-anh-6-moi-a22529.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-33-unit-9-sgk-tieng-anh-6-moi-a22532.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-34-unit-9-sgk-tieng-anh-6-moi-a22533.html'
  },
  '10': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-38-unit-10-sgk-tieng-anh-6-moi-a22540.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-40-unit-10-sgk-tieng-anh-6-moi-a22541.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-41-unit-10-sgk-tieng-anh-6-moi-a22542.html',
    'communication': 'https://loigiaihay.com/communication-trang-43-unit-10-sgk-tieng-anh-6-moi-a22543.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-44-unit-10-sgk-tieng-anh-6-moi-a22544.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-45-unit-10-sgk-tieng-anh-6-moi-a22545.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-46-unit-10-sgk-tieng-anh-6-moi-a22546.html'
  },
  '11': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-48-unit-11-sgk-tieng-anh-6-moi-a22550.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-50-unit-11-sgk-tieng-anh-6-moi-a22552.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-51-unit-11-sgk-tieng-anh-6-moi-a22553.html',
    'communication': 'https://loigiaihay.com/communication-trang-53-unit-11-sgk-tieng-anh-6-moi-a22554.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-54-unit-11-sgk-tieng-anh-6-moi-a22555.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-55-unit-11-sgk-tieng-anh-6-moi-a22556.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-56-unit-11-sgk-tieng-anh-6-moi-a22557.html'
  },
  '12': {
    'getting-started': 'https://loigiaihay.com/getting-started-trang-58-unit-12-sgk-tieng-anh-6-moi-a22561.html',
    'a-closer-look-1': 'https://loigiaihay.com/a-closer-look-1-trang-60-unit-12-sgk-tieng-anh-6-moi-a22562.html',
    'a-closer-look-2': 'https://loigiaihay.com/a-closer-look-2-trang-61-unit-12-sgk-tieng-anh-6-moi-a22564.html',
    'communication': 'https://loigiaihay.com/communication-trang-63-unit-12-sgk-tieng-anh-6-moi-a22565.html',
    'skills-1': 'https://loigiaihay.com/skills-1-trang-64-unit-12-sgk-tieng-anh-6-moi-a22566.html',
    'skills-2': 'https://loigiaihay.com/skills-2-trang-65-unit-12-sgk-tieng-anh-6-moi-a22567.html',
    'looking-back': 'https://loigiaihay.com/looking-back-trang-66-unit-12-sgk-tieng-anh-6-moi-a22568.html'
  }
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let successCount = 0;
  let errorCount = 0;

  for (const [unitNum, sections] of Object.entries(units)) {
    const unit = `unit-${unitNum.padStart(2, '0')}`;
    const dir = `loigiaihay.com/grade6/${unit}`;
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
