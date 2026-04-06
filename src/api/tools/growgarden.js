const axios = require("axios")
const cheerio = require("cheerio")

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
          "User-Agent": "Mozilla/5.0",
          "Cookie": cookies()
        }
      })

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

      let craving = []
      $("#craving_list li").each((i, li) => {
        let n = $(li).find("span:nth-child(2)").text().trim()
        let img = $(li).find("img").attr("src")

        if (n && n !== "No accepted plants right now.")
          craving.push({
            name: n,
            image: img ? (img.startsWith("http") ? img : baseUrl + img) : null
          })
      })

      if (craving.length) stock["Craving"] = craving

      $(".mt-16 .space-y-6 li").each((i, el) => {
        let t = $(el).find("a").text().trim()
        let l = $(el).find("a").attr("href")
        let d = $(el).find("p").text().trim()

        if (t && l) blog.push({
          title: t,
          link: l.startsWith("http") ? l : baseUrl + l,
          description: d
        })
      })

      $(".grid.md\\:grid-cols-3.gap-6.mt-14 article").each((i, el) => {
        let t = $(el).find("h3").text().trim()
        let d = $(el).find("p").text().trim()
        if (t) info.push({ title: t, description: d })
      })

      res.json({
        status: true,
        creator: "yasamDev",
        result: {
          stock,
          blog,
          info,
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