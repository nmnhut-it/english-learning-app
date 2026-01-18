const { chromium } = require('playwright');
const fs = require('fs');

// Grade 10 URLs - same structure as Grade 11/12 (8 sections per unit)
const units = {
  '1': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-10-unit-1-getting-started-a105283.html',
    'language': 'https://loigiaihay.com/tieng-anh-10-unit-1-language-a105288.html',
    'reading': 'https://loigiaihay.com/tieng-anh-10-unit-1-reading-a105290.html',
    'speaking': 'https://loigiaihay.com/tieng-anh-10-unit-1-speaking-a105705.html',
    'listening': 'https://loigiaihay.com/tieng-anh-10-unit-1-listening-a105724.html',
    'writing': 'https://loigiaihay.com/tieng-anh-10-unit-1-writing-a105732.html',
    'communication-and-culture-clil': 'https://loigiaihay.com/tieng-anh-10-unit-1-communication-and-culture-clil-a105765.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-10-unit-1-looking-back-a105806.html'
  },
  '2': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-10-unit-2-getting-started-a105812.html',
    'language': 'https://loigiaihay.com/tieng-anh-10-unit-2-language-a105826.html',
    'reading': 'https://loigiaihay.com/tieng-anh-10-unit-2-reading-a105836.html',
    'speaking': 'https://loigiaihay.com/tieng-anh-10-unit-2-speaking-a105846.html',
    'listening': 'https://loigiaihay.com/tieng-anh-10-unit-2-listening-a105853.html',
    'writing': 'https://loigiaihay.com/tieng-anh-10-unit-2-writing-a105859.html',
    'communication-and-culture-clil': 'https://loigiaihay.com/tieng-anh-10-unit-2-communication-and-culture-clil-a105866.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-10-unit-2-looking-back-a105976.html'
  },
  '3': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-10-unit-3-getting-started-a105982.html',
    'language': 'https://loigiaihay.com/tieng-anh-10-unit-3-language-a105987.html',
    'reading': 'https://loigiaihay.com/tieng-anh-10-unit-3-reading-a105993.html',
    'speaking': 'https://loigiaihay.com/tieng-anh-10-unit-3-speaking-a105997.html',
    'listening': 'https://loigiaihay.com/tieng-anh-10-unit-3-listening-a105998.html',
    'writing': 'https://loigiaihay.com/tieng-anh-10-unit-3-writing-a105999.html',
    'communication-and-culture-clil': 'https://loigiaihay.com/tieng-anh-10-unit-3-communication-and-culture-clil-a106000.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-10-unit-3-looking-back-a106014.html'
  },
  '4': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-10-unit-4-getting-started-a106060.html',
    'language': 'https://loigiaihay.com/tieng-anh-10-unit-4-language-a106141.html',
    'reading': 'https://loigiaihay.com/tieng-anh-10-unit-4-reading-a106142.html',
    'speaking': 'https://loigiaihay.com/tieng-anh-10-unit-4-speaking-a106143.html',
    'listening': 'https://loigiaihay.com/tieng-anh-10-unit-4-listening-a106146.html',
    'writing': 'https://loigiaihay.com/tieng-anh-10-unit-4-writing-a106156.html',
    'communication-and-culture-clil': 'https://loigiaihay.com/tieng-anh-10-unit-4-communication-and-culture-clil-a106168.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-10-unit-4-looking-back-a106216.html'
  },
  '5': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-10-unit-5-getting-started-a106222.html',
    'language': 'https://loigiaihay.com/tieng-anh-10-unit-5-language-a106246.html',
    'reading': 'https://loigiaihay.com/tieng-anh-10-unit-5-reading-a106316.html',
    'speaking': 'https://loigiaihay.com/tieng-anh-10-unit-5-speaking-a106317.html',
    'listening': 'https://loigiaihay.com/tieng-anh-10-unit-5-listening-a106318.html',
    'writing': 'https://loigiaihay.com/tieng-anh-10-unit-5-writing-a106319.html',
    'communication-and-culture-clil': 'https://loigiaihay.com/tieng-anh-10-unit-5-communication-and-culture-clil-a106432.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-10-unit-5-looking-back-a106433.html'
  },
  '6': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-10-unit-6-getting-started-a110099.html',
    'language': 'https://loigiaihay.com/tieng-anh-10-unit-6-language-a110102.html',
    'reading': 'https://loigiaihay.com/tieng-anh-10-unit-6-reading-a110247.html',
    'speaking': 'https://loigiaihay.com/tieng-anh-10-unit-6-speaking-a110248.html',
    'listening': 'https://loigiaihay.com/tieng-anh-10-unit-6-listening-a110249.html',
    'writing': 'https://loigiaihay.com/tieng-anh-10-unit-6-writing-a110252.html',
    'communication-and-culture-clil': 'https://loigiaihay.com/tieng-anh-10-unit-6-communication-and-culture-clil-a110258.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-10-unit-6-looking-back-a110465.html'
  },
  '7': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-10-unit-7-getting-started-a110471.html',
    'language': 'https://loigiaihay.com/tieng-anh-10-unit-7-language-a110472.html',
    'reading': 'https://loigiaihay.com/tieng-anh-10-unit-7-reading-a110473.html',
    'speaking': 'https://loigiaihay.com/tieng-anh-10-unit-7-speaking-a110475.html',
    'listening': 'https://loigiaihay.com/tieng-anh-10-unit-7-listening-a110476.html',
    'writing': 'https://loigiaihay.com/tieng-anh-10-unit-7-writing-a110478.html',
    'communication-and-culture-clil': 'https://loigiaihay.com/tieng-anh-10-unit-7-communication-and-culture-clil-a110481.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-10-unit-7-looking-back-a110525.html'
  },
  '8': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-10-unit-8-getting-started-a110531.html',
    'language': 'https://loigiaihay.com/tieng-anh-10-unit-8-language-a110535.html',
    'reading': 'https://loigiaihay.com/tieng-anh-10-unit-8-reading-a110552.html',
    'speaking': 'https://loigiaihay.com/tieng-anh-10-unit-8-speaking-a110553.html',
    'listening': 'https://loigiaihay.com/tieng-anh-10-unit-8-listening-a110554.html',
    'writing': 'https://loigiaihay.com/tieng-anh-10-unit-8-writing-a110555.html',
    'communication-and-culture-clil': 'https://loigiaihay.com/tieng-anh-10-unit-8-communication-and-culture-clil-a110556.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-10-unit-8-looking-back-a110705.html'
  },
  '9': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-10-unit-9-getting-started-a110711.html',
    'language': 'https://loigiaihay.com/tieng-anh-10-unit-9-language-a112921.html',
    'reading': 'https://loigiaihay.com/tieng-anh-10-unit-9-reading-a112948.html',
    'speaking': 'https://loigiaihay.com/tieng-anh-10-unit-9-speaking-a112966.html',
    'listening': 'https://loigiaihay.com/tieng-anh-10-unit-9-listening-a112976.html',
    'writing': 'https://loigiaihay.com/tieng-anh-10-unit-9-writing-a113076.html',
    'communication-and-culture-clil': 'https://loigiaihay.com/tieng-anh-10-unit-9-communication-and-culture-clil-a113087.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-10-unit-9-looking-back-a113301.html'
  },
  '10': {
    'getting-started': 'https://loigiaihay.com/tieng-anh-10-unit-10-getting-started-a113307.html',
    'language': 'https://loigiaihay.com/tieng-anh-10-unit-10-language-a113309.html',
    'reading': 'https://loigiaihay.com/tieng-anh-10-unit-10-reading-a113327.html',
    'speaking': 'https://loigiaihay.com/tieng-anh-10-unit-10-speaking-a113334.html',
    'listening': 'https://loigiaihay.com/tieng-anh-10-unit-10-listening-a113341.html',
    'writing': 'https://loigiaihay.com/tieng-anh-10-unit-10-writing-a113356.html',
    'communication-and-culture-clil': 'https://loigiaihay.com/tieng-anh-10-unit-10-communication-and-culture-clil-a113359.html',
    'looking-back': 'https://loigiaihay.com/tieng-anh-10-unit-10-looking-back-a113520.html'
  }
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let successCount = 0;
  let errorCount = 0;

  for (const [unitNum, sections] of Object.entries(units)) {
    const unit = `unit-${unitNum.padStart(2, '0')}`;
    const dir = `loigiaihay.com/grade10/${unit}`;
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
