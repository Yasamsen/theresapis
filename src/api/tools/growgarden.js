const axios = require("axios")
const cheerio = require("cheerio")
const crypto = require("crypto")

module.exports = (app) => {

  const baseUrl = "https://growagardenstocknow.com"

  const cookies = () => {
    let t = Math.floor(Date.now() / 1000)
    let r = Math.floor(Math.random() * 1e9)
    return `js_verified=1; _ga=GA1.1.${r}.${t}; _gid=GA1.2.${r}.${t}`
  }

  app.get("/tools/growgarden", async (req, res) => {
    try {

      const { data } = await axios.get(baseUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Referer": "https://www.google.com/",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cookie": cookies()
        },
        timeout: 30000,
        validateStatus: () => true // biar ga auto throw
      })

      if (data.includes("Just a moment") || data.includes("cf-challenge")) {
        throw new Error("Blocked by Cloudflare")
      }

      const $ = cheerio.load(data)

      let stock = {}, blog = [], info = []

      $("article[aria-label]").each((i, el) => {
        let name = ($(el).attr("aria-label") || $(el).find("h2").text()).replace("Stock","").trim()
        let items = []

        $(el).find("ul li").each((i, li) => {
          let n = $(li).find("span:nth-child(2)").text().trim()
          let img = $(li).find("img").attr("src")
          let q = ($(li).find("span:last-child").text().match(/\d+/)||[])[0]

          if (n && n !== "No accepted plants right now.")
            items.push({
              name: n,
              quantity: q ? +q : null,
              image: img ? (img.startsWith("http") ? img : baseUrl + img) : null
            })
        })

        if (items.length) stock[name] = items
      })

      res.json({
        status: true,
        creator: "yasamDev",
        result: {
          stock,
          timestamp: new Date().toISOString(),
          url: baseUrl
        }
      })

    } catch (err) {

      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: err.message
      })

    }
  })

}