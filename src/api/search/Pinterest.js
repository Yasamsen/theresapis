const puppeteer = require("puppeteer");

module.exports = function (app) {

  app.get("/search/pinterest", async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: false,
        error: "Parameter q wajib diisi"
      });
    }

    let browser;

    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });

      const page = await browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
      );

      await page.goto(
        "https://www.pinterest.com/search/pins/?q=" + encodeURIComponent(q),
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
        return res.json({
          status: false,
          message: "No result found"
        });
      }

      res.json({
        status: true,
        total: results.length,
        result: results
      });

    } catch (err) {
      if (browser) await browser.close();

      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};