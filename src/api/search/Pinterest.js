const puppeteer = require("puppeteer");

// Fungsi utama untuk scrape Pinterest
module.exports = function (app) {
	
async function scrapePinterest(query) {
  if (!query) throw new Error("Parameter q wajib diisi");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
  );

  await page.goto(
    "https://www.pinterest.com/search/pins/?q=" + encodeURIComponent(query),
    { waitUntil: "networkidle2" }
  );

  await page.waitForSelector("img");

  const results = await page.evaluate(() => {
    const images = [];
    document.querySelectorAll("img").forEach(img => {
      if (img.src && img.src.includes("236x")) {
        images.push(img.src.replace("236x", "736x"));
      }
    });
    return [...new Set(images)];
  });

  await browser.close();

  if (!results.length) {
    return { status: false, message: "No result found" };
  }

  return { status: true, total: results.length, result: results };
}

// Endpoint Express di bawah

  app.get("/search/Pinterest", async (req, res) => {
    const { q } = req.query;

    try {
      const data = await scrapePinterest(q);
      res.json(data);
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};