const { chromium } = require('playwright');
const fs = require('fs');

// Review URLs for grades 6-9 (Global Success)
// Reviews: 4 per grade x 2 sections (language + skills)
// Output: loigiaihay.com/grade{N}/review-{N}/{section}.html

const gradeReviews = {
  grade6: {
    // Grade 6 uses a different URL pattern than grades 7-9
    '1': {
      'language': 'https://loigiaihay.com/language-ngon-ngu-trang-36-review-1-units-1-2-3-sgk-tieng-anh-6-moi-c134a22053.html',
      'skills': 'https://loigiaihay.com/skills-ky-nang-trang-37-review-1-units-1-2-3-sgk-tieng-anh-6-moi-c134a22057.html'
    },
    '2': {
      'language': 'https://loigiaihay.com/language-ngon-ngu-trang-68-review-2-units-4-5-6-sgk-tieng-anh-6-moi-c134a22140.html',
      'skills': 'https://loigiaihay.com/skills-ky-nang-trang-69-review-2-units-4-5-6-sgk-tieng-anh-6-moi-c134a22141.html'
    },
    '3': {
      'language': 'https://loigiaihay.com/language-ngon-ngu-trang-36-review-3-units-7-8-9-sgk-tieng-anh-6-moi-c134a22535.html',
      'skills': 'https://loigiaihay.com/skills-ky-nang-trang-37-review-3-units-7-8-9-tieng-anh-6-moi-c134a22536.html'
    },
    '4': {
      'language': 'https://loigiaihay.com/language-ngon-ngu-trang-68-review-4-units-10-11-12-sgk-tieng-anh-6-moi-c134a22571.html',
      'skills': 'https://loigiaihay.com/skills-ky-nang-trang-69-review-4-units-10-11-12-sgk-tieng-anh-6-moi-c134a22572.html'
    }
  },
  grade7: {
    '1': {
      'language': 'https://loigiaihay.com/tieng-anh-7-review-1-language-a107652.html',
      'skills': 'https://loigiaihay.com/tieng-anh-7-review-1-skills-a107672.html'
    },
    '2': {
      'language': 'https://loigiaihay.com/tieng-anh-7-review-2-language-a108597.html',
      'skills': 'https://loigiaihay.com/tieng-anh-7-review-2-skills-a108598.html'
    },
    '3': {
      'language': 'https://loigiaihay.com/tieng-anh-7-review-3-language-a108811.html',
      'skills': 'https://loigiaihay.com/tieng-anh-7-review-3-skills-a108817.html'
    },
    '4': {
      'language': 'https://loigiaihay.com/tieng-anh-7-review-4-language-a109190.html',
      'skills': 'https://loigiaihay.com/tieng-anh-7-review-4-skills-a109191.html'
    }
  },
  grade8: {
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
  },
  grade9: {
    '1': {
      'language': 'https://loigiaihay.com/tieng-anh-9-review-1-language-a156786.html',
      'skills': 'https://loigiaihay.com/tieng-anh-9-review-1-skills-a156792.html'
    },
    '2': {
      'language': 'https://loigiaihay.com/tieng-anh-9-review-2-language-a156933.html',
      'skills': 'https://loigiaihay.com/tieng-anh-9-review-2-skills-a156934.html'
    },
    '3': {
      'language': 'https://loigiaihay.com/tieng-anh-9-review-3-language-a163748.html',
      'skills': 'https://loigiaihay.com/tieng-anh-9-review-3-skills-a163749.html'
    },
    '4': {
      'language': 'https://loigiaihay.com/tieng-anh-9-review-4-language-a163909.html',
      'skills': 'https://loigiaihay.com/tieng-anh-9-review-4-skills-a163910.html'
    }
  }
};

// Allow filtering by grade: node scrape-reviews.js grade8
const targetGrade = process.argv[2] || null;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let successCount = 0;
  let errorCount = 0;

  const gradesToScrape = targetGrade
    ? { [targetGrade]: gradeReviews[targetGrade] }
    : gradeReviews;

  for (const [grade, reviews] of Object.entries(gradesToScrape)) {
    if (!reviews) {
      console.log(`Unknown grade: ${grade}`);
      continue;
    }

    for (const [reviewNum, sections] of Object.entries(reviews)) {
      const review = `review-${reviewNum}`;
      const dir = `loigiaihay.com/${grade}/${review}`;
      fs.mkdirSync(dir, { recursive: true });

      for (const [section, url] of Object.entries(sections)) {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          const html = await page.content();
          fs.writeFileSync(`${dir}/${section}.html`, html);
          console.log(`OK: ${grade}/${review}/${section}`);
          successCount++;
        } catch (e) {
          console.log(`ERR: ${grade}/${review}/${section} - ${e.message.split('\n')[0]}`);
          errorCount++;
        }
      }
    }
  }

  await browser.close();
  console.log(`\nDone! Success: ${successCount}, Errors: ${errorCount}`);
})();
