const axios = require("axios")
const cheerio = require("cheerio")
const crypto = require("crypto")

module.exports = (app) => {

  const baseUrl = "https://growagardenstocknow.com"

  const cookies = () => {
    let t = Date.now()
    return `js_verified=1; _ga=GA1.1.${Math.random()*1e9}.${t}; _gid=GA1.2.${Math.random()*1e9}.${t}`
  }

  const headers = () => ({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://www.google.com/",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
    "Cookie": cookies()
  })

  async function fetchWithRetry(url, tries = 3) {
    for (let i = 0; i < tries; i++) {
      try {
        const res = await axios.get(url, {
          headers: headers(),
          timeout: 20000,
          validateStatus: () => true
        })

        // detect block
        if (
          res.data.includes("Just a moment") ||
          res.data.includes("cf-challenge") ||
          res.status === 403
        ) {
          throw new Error("Blocked")
        }

        return res.data

      } catch (err) {
        if (i === tries - 1) throw err
        await new Promise(r => setTimeout(r, 2000)) // delay retry
      }
    }
  }

  app.get("/tools/growgarden", async (req, res) => {
    try {

      const html = await fetchWithRetry(baseUrl)
      const $ = cheerio.load(html)

      let stock = {}

      $("article[aria-label]").each((i, el) => {
        let name = ($(el).attr("aria-label") || $(el).find("h2").text()).replace("Stock","").trim()
        let items = []

        $(el).find("ul li").each((i, li) => {
          let n = $(li).find("span:nth-child(2)").text().trim()
          if (n && n !== "No accepted plants right now.") {
            items.push({ name: n })
          }
        })

        if (items.length) stock[name] = items
      })

      res.json({
        status: true,
        creator: "yasamDev",
        result: stock
      })

    } catch (err) {

      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: "Masih diblokir Cloudflare / butuh proxy"
      })

    }
  })

}