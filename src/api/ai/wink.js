"use strict";

const express  = require("express");
const path     = require("path");
const fs       = require("fs");
const axios    = require("axios");
const FormData = require("form-data");
const qs       = require("qs");
const { v4: uuidv4 } = require("uuid");

const API = {
  BASE:     'https://wink.ai',
  STRATEGY: 'https://strategy.app.meitudata.com',
  QINIU:    'https://up-qagw.meitudata.com',
};

const CLIENT = {
  ID:       '1189857605',
  VERSION:  '3.7.1',
  LANGUAGE: 'en_US',
};

const TASK = {
  HD:       { type: 2,  label: 'HD Image',       content_type: 1, free: true },
  ULTRA_HD: { type: 12, label: 'Ultra HD Image',  content_type: 1, free: true },
};

const TYPE_PARAMS = { is_mirror: 0, orientation_tag: 1, j_420_trans: '1', return_ext: '2' };
const RIGHT_DETAIL = { source: '4', touch_type: '4', function_id: '630', material_id: '63001' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadOrCreateGnum() {
  const f = path.join(process.cwd(), '.wink_gnum');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  const ts = Date.now().toString(16);
  const r1 = Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12);
  const r2 = Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12);
  const g  = `${ts}-${r1}-10462c6e-288000-${ts}${r2.slice(0, 3)}`;
  fs.writeFileSync(f, g);
  return g;
}

class WinkClient {
  constructor(opts = {}) {
    this.outputDir = opts.outputDir || '/tmp';
    this.gnum      = loadOrCreateGnum();
    this.country   = opts.country  || 'ID';
    this.timezone  = opts.timezone || 'Asia/Jakarta';
    this._timing   = {};

    fs.existsSync(this.outputDir) || fs.mkdirSync(this.outputDir, { recursive: true });

    this.http = axios.create({
      baseURL: API.BASE,
      timeout: 60_000,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': API.BASE,
        'Referer': `${API.BASE}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
      }
    });

    this.http.interceptors.response.use(null, async err => {
      const cfg = err.config || {};
      cfg._retries = (cfg._retries || 0) + 1;
      const status = err.response?.status;
      if (cfg._retries <= 3 && (status >= 500 || !status)) {
        await sleep(cfg._retries * 2000);
        return this.http(cfg);
      }
      return Promise.reject(err);
    });
  }

  _p(extra = {}) { return { client_id: CLIENT.ID, version: CLIENT.VERSION, country_code: this.country, gnum: this.gnum, client_language: CLIENT.LANGUAGE, client_channel_id:'', client_timezone: this.timezone, ...extra }; }
  _t(name){ this._timing[name] = { start: Date.now() }; }
  _te(name){ if(this._timing[name]) this._timing[name].ms = Date.now() - this._timing[name].start; }

  async init() {
    this._t('init');
    const p = this._p();
    const [initRes, taskTypeRes, groupRes] = await Promise.allSettled([
      this.http.get('/api/init.json',{ params: p }),
      this.http.get('/api/meitu_ai/task_type_config.json',{ params: p }),
      this.http.get('/api/meitu_ai_task_group/get_config.json',{ params: p })
    ]);
    const safe = r => r.status === 'fulfilled' ? r.value.data?.data : null;
    this._te('init');
    return { platform: safe(initRes), task_types: safe(taskTypeRes)||[], task_group: safe(groupRes) };
  }

  async uploadFile(filePath) {
    this._t('upload');
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const ext  = path.extname(filePath).toLowerCase() || '.jpg';
    const stat = fs.statSync(filePath);
    const validImg = ['.jpg','.jpeg','.png','.webp','.bmp','.gif'];
    if (!validImg.includes(ext)) throw new Error(`Unsupported format: ${ext}`);
    const signRes = await this.http.get('/api/file/get_maat_sign.json',{ params: this._p({ suffix: ext, type:'temp', count:1 }) });
    const sign = signRes.data?.data;
    if(!sign?.sig) throw new Error('Failed to get upload signature');
    const policyRes = await axios.get(`${API.STRATEGY}/upload/policy`,{ params:{ app:sign.app||'wink', count:1, sig:sign.sig, sigTime:sign.sig_time, sigVersion:sign.sig_version, suffix:ext, type:'temp' }, timeout:15000 });
    const qiniu = policyRes.data?.[0]?.qiniu;
    if(!qiniu?.token) throw new Error('Failed to get Qiniu policy');
    const form = new FormData();
    form.append('token', qiniu.token);
    form.append('key', qiniu.key);
    form.append('file', fs.createReadStream(filePath), { filename:path.basename(filePath), contentType:`image/${ext.replace('.','').replace('jpg','jpeg')}` });
    const uploadRes = await axios.post(qiniu.url||API.QINIU, form, { headers:form.getHeaders(), timeout:300_000, maxBodyLength:Infinity, maxContentLength:Infinity });
    const uploaded = uploadRes.data;
    if(!uploaded?.url) throw new Error('Qiniu upload returned no URL');
    const metaRes = await this.http.post('/api/file/meta_info.json', qs.stringify({ ...this._p(), file_key: qiniu.key }), { headers:{ 'Content-Type':'application/x-www-form-urlencoded' } });
    const meta = metaRes.data?.data;
    this._te('upload');
    return { fileKey:qiniu.key, fileUrl:uploaded.url, localPath:filePath, fileName:path.basename(filePath), localSize:stat.size, meta };
  }

  async submitTask(upload, taskCfg) {
    this._t('submit');
    const beansBody = qs.stringify({ ...this._p(), item_list:JSON.stringify([{ type:taskCfg.type, ext_value:'1', content_type:taskCfg.content_type, duration:0, type_params:JSON.stringify(TYPE_PARAMS), right_detail:JSON.stringify(RIGHT_DETAIL) }]) });
    const beansRes = await this.http.post('/api/subscribe/batch_calc_need_beans.json', beansBody, { headers:{ 'Content-Type':'application/x-www-form-urlencoded' } });
    const beans = beansRes.data?.data || {};
    const taskName = `${taskCfg.label.replace(/\s+/g,'_')}-${uuidv4().replace(/-/g,'').slice(0,16)}`;
    const body = qs.stringify({ ...this._p(), type:taskCfg.type, source_url:upload.fileUrl, content_type:taskCfg.content_type, ext_params:JSON.stringify({ task_name:taskName, records:'2' }), type_params:JSON.stringify(TYPE_PARAMS), right_detail:JSON.stringify(RIGHT_DETAIL), with_prepare:1 });
    const res = await this.http.post('/api/meitu_ai/delivery.json', body, { headers:{ 'Content-Type':'application/x-www-form-urlencoded' } });
    const delivery = res.data?.data;
    if(!delivery?.prepare_msg_id) throw new Error('No prepare_msg_id from delivery');
    this._te('submit');
    return { prepareMsgId: delivery.prepare_msg_id, taskName, beans };
  }

  async waitForResult(task, pollMs=2000, timeoutMs=300_000) {
    this._t('poll');
    const deadline = Date.now()+timeoutMs;
    let msgId = task.prepareMsgId, attempt=0;
    while(Date.now()<deadline){
      attempt++;
      await sleep(attempt===1?800:pollMs);
      let res;
      try{ res = await this.http.get('/api/meitu_ai/query_batch.json',{ params:{ ...this._p(), msg_ids:msgId } }); } catch { continue; }
      const item = res.data?.data?.item_list?.[0];
      if(!item) continue;
      const media = item.result?.media_info_list;
      if(media?.length && media[0].media_data){ this._te('poll'); return { msgId, media:{ url:media[0].media_data, thumbUrl:media[0].thumb_pic, coverUrl:media[0].cover_pic, width:item.width, height:item.height, size:item.size, sizeHuman:item.size_human } }; }
    }
    this._te('poll'); throw new Error('Timeout waiting result');
  }
}

// ==================== ROUTE LANANG ====================
const app = express();

app.get("/ai/wink", async (req, res) => {
  const { image, type = "hd" } = req.query;
  if (!image) return res.status(400).json({ status:false, creator:"yasamDev", error:"Parameter image wajib" });
  try {
    const client = new WinkClient({ outputDir:"/tmp" });
    const TASK_SELECT = { hd:TASK.HD, ultra:TASK.ULTRA_HD };
    const selectedTask = TASK_SELECT[type.toLowerCase()];
    if(!selectedTask) return res.status(400).json({ status:false, error:"Type hanya hd/ultra" });

    // download image
    const tmpPath = `/tmp/${Date.now()}.jpg`;
    const response = await axios({ url:image, method:"GET", responseType:"stream" });
    await new Promise((ok,fail)=>{ const w=fs.createWriteStream(tmpPath); response.data.pipe(w); w.on('finish',ok); w.on('error',fail); });

    const initData = await client.init();
    const upload   = await client.uploadFile(tmpPath);
    const task     = await client.submitTask(upload, selectedTask);
    const result   = await client.waitForResult(task);

    res.status(200).json({ status:true, creator:"yasamDev", result:{ type:selectedTask.label, input:image, output:result.media?.url, thumb:result.media?.thumbUrl, size:result.media?.sizeHuman, width:result.media?.width, height:result.media?.height } });

  } catch(err) {
    res.status(500).json({ status:false, creator:"yasamDev", error:err.message });
  }
});