"use strict";

const https = require("https");
const http = require("http");
const { URL } = require("url");

/* ================= CONFIG ================= */
const BASE_URL = "https://ytmp3.gs";
const EPSILON_BASE = "https://epsilon.epsiloncloud.org";
const INIT_PATH = "/api/v1/init";
const MAX_REDIRECT = 8;
const TIMEOUT_MS = 20000;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134.0.0.0 Safari/537.36";

const HEADERS_HTML = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-encoding": "identity",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  "user-agent": UA,
};

const HEADERS_XHR = {
  accept: "application/json, text/javascript, */*; q=0.01",
  "accept-encoding": "identity",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  pragma: "no-cache",
  origin: BASE_URL,
  referer: BASE_URL + "/",
  "user-agent": UA,
  "x-requested-with": "XMLHttpRequest",
};

/* ================= REQUEST ================= */
function request(rawUrl, headers = HEADERS_XHR, parseJson = true) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(rawUrl);
    const lib = parsed.protocol === "https:" ? https : http;

    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: { ...headers, host: parsed.hostname },
      timeout: TIMEOUT_MS,
    }, (res) => {

      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, rawUrl).href;
        return resolve(request(next, headers, parseJson));
      }

      let raw = "";
      res.setEncoding("utf8");
      res.on("data", c => raw += c);
      res.on("end", () => {
        let body = raw;
        if (parseJson) {
          try { body = JSON.parse(raw); } catch {}
        }
        resolve({ status: res.statusCode, headers: res.headers, body, raw });
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });

    req.end();
  });
}

/* ================= UTILS ================= */
function parseCookies(h) {
  if (!h) return "";
  const arr = Array.isArray(h) ? h : [h];
  return arr.map(c => c.split(";")[0]).join("; ");
}

function extractVideoId(input) {
  if (!input) throw new Error("No input");

  for (const re of [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/(shorts|embed|live)\/([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ]) {
    const m = input.match(re);
    if (m) return m[1] || m[2];
  }

  throw new Error("Invalid YouTube URL");
}

/* ================= AUTH ================= */
function computeAuthorization(json) {
  const j0 = json[0], j1 = json[1], j2 = json[2];
  let e = "";
  for (let i = 0; i < j0.length; i++) {
    e += String.fromCharCode(j0[i] - j2[j2.length - (i + 1)]);
  }
  if (j1) e = e.split("").reverse().join("");
  return e.substring(0, 32);
}

function findJsonConfig(src) {
  const match = src.match(/\[(\d+,?)+\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return parsed;
  } catch {
    return null;
  }
}

async function getAuthKey() {
  const res = await request(BASE_URL, HEADERS_HTML, false);
  const html = res.raw;
  const cfg = findJsonConfig(html);

  if (!cfg) throw new Error("Auth config not found");

  return {
    authKey: computeAuthorization(cfg),
    paramName: "k"
  };
}

/* ================= CORE ================= */
async function youtubeDownloader(url, format="mp3") {
  const videoId = extractVideoId(url);

  const auth = await getAuthKey();

  const init = await request(
    `${EPSILON_BASE}${INIT_PATH}?${auth.paramName}=${auth.authKey}&t=${Date.now()}`
  );

  if (!init.body.convertURL) throw new Error("Init gagal");

  const conv = await request(
    `${init.body.convertURL}&v=${videoId}&f=${format}&t=${Date.now()}`
  );

  return {
    title: conv.body.title || null,
    download: conv.body.downloadURL || null,
    progress: conv.body.progressURL || null,
    videoId
  };
}

/* ================= ROUTE ================= */
module.exports = function(app){

  app.get("/download/ytmp3", async (req,res)=>{
    const { url } = req.query;

    if(!url){
      return res.status(400).json({
        status:false,
        error:"Url is required"
      });
    }

    try{
      const data = await youtubeDownloader(url,"mp3");

      res.json({
        status:true,
        result:{
          title: data.title,
          videoId: data.videoId,
          format:"mp3",
          download: data.download,
          progress_url: data.progress,
          source:"ytmp3.gs"
        }
      });

    }catch(err){
      console.error(err);
      res.status(500).json({
        status:false,
        error:err.message
      });
    }
  });

};