import axios from "axios";
import cheerio from "cheerio";
import crypto from "crypto";

const baseUrl = "https://s2.animekuindo.life";

function generateCookies() {
  return `_ga=${crypto.randomUUID()};`;
}

async function request(url) {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": baseUrl,
      "Cookie": generateCookies()
    }
  });
  return cheerio.load(data);
}

/* ================= SEARCH ================= */
app.get("/anime/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({
        status: false,
        creator: "yasamDev",
        error: "Masukkan query"
      });
    }

    const $ = await request(`${baseUrl}/?s=${encodeURIComponent(q)}`);

    let results = [];

    $(".listupd .bs").each((i, el) => {
      results.push({
        title: $(el).find("h2").text().trim(),
        link: $(el).find("a").attr("href"),
        image: $(el).find("img").attr("src"),
        status: $(el).find(".status").text().trim(),
        type: $(el).find(".typez").text().trim()
      });
    });

    res.json({
      status: true,
      creator: "yasamDev",
      total: results.length,
      result: results
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      creator: "yasamDev",
      error: err.message
    });
  }
});

/* ================= DETAIL ================= */
app.get("/anime/detail", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.json({
        status: false,
        creator: "yasamDev",
        error: "Masukkan url"
      });
    }

    const $ = await request(url);

    let episodes = [];

    $(".eplister ul li").each((i, el) => {
      episodes.push({
        episode: $(el).find(".epl-num").text(),
        title: $(el).find(".epl-title").text(),
        link: $(el).find("a").attr("href"),
        date: $(el).find(".epl-date").text()
      });
    });

    res.json({
      status: true,
      creator: "yasamDev",
      result: {
        title: $("h1.entry-title").text(),
        image: $(".thumb img").attr("src"),
        sinopsis: $(".entry-content p").text(),
        totalEpisodes: episodes.length,
        episodes: episodes.reverse()
      }
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      creator: "yasamDev",
      error: err.message
    });
  }
});

/* ================= STREAM ================= */
app.get("/anime/stream", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.json({
        status: false,
        creator: "yasamDev",
        error: "Masukkan url episode"
      });
    }

    const $ = await request(url);

    const mainStream = $("#pembed iframe").attr("src") || null;

    const mirrors = [];
    $(".mirrorstream ul li a").each((i, el) => {
      mirrors.push({
        provider: $(el).text().trim(),
        data: $(el).attr("data-content")
      });
    });

    res.json({
      status: true,
      creator: "yasamDev",
      result: {
        stream: mainStream,
        mirrors
      }
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      creator: "yasamDev",
      error: err.message
    });
  }
});