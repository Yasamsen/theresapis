const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);

const WORK_DIR = '/tmp/media-repo';
const OWNER = process.env.REPO_OWNER || 'Yasamsen';
const REPO_NAME = process.env.REPO_NAME || 'media-repo';
const BRANCH = process.env.REPO_BRANCH || 'main';

function run(cmd, cwd) {
  return execAsync(cmd, { cwd, maxBuffer: 20 * 1024 * 1024 });
}

async function ensureRepo() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN belum di-set di Environment Variables Vercel.');
  const remote = `https://x-access-token:${token}@github.com/${OWNER}/${REPO_NAME}.git`;

  if (!fs.existsSync(path.join(WORK_DIR, '.git'))) {
    fs.rmSync(WORK_DIR, { recursive: true, force: true });
    await run(`git clone --depth 1 -b ${BRANCH} ${remote} ${WORK_DIR}`, '/tmp');
    await run(`git config user.email "bot@web-terminal.local"`, WORK_DIR);
    await run(`git config user.name "web-terminal"`, WORK_DIR);
  } else {
    // pastikan remote pakai token terbaru (kalau token diganti)
    await run(`git remote set-url origin ${remote}`, WORK_DIR);
    try {
      await run(`git pull origin ${BRANCH} --rebase`, WORK_DIR);
    } catch (e) {
      // kalau gagal rebase, reset ke state remote biar tidak macet
      await run(`git fetch origin ${BRANCH}`, WORK_DIR);
      await run(`git reset --hard origin/${BRANCH}`, WORK_DIR);
    }
  }
}

function nextCounter(folderDir) {
  if (!fs.existsSync(folderDir)) return 1;
  const files = fs.readdirSync(folderDir).filter((f) => /^[0-9]{3}\./.test(f));
  if (files.length === 0) return 1;
  files.sort();
  const last = files[files.length - 1];
  const lastNum = parseInt(last.slice(0, 3), 10);
  return lastNum + 1;
}

function regenerateApiJson(folderDir, folder) {
  const rawBase = `https://raw.githubusercontent.com/${OWNER}/${REPO_NAME}/${BRANCH}/${folder}`;
  const files = fs
    .readdirSync(folderDir)
    .filter((f) => /\.(jpg|jpeg|png|webp|mp4)$/i.test(f))
    .sort();
  const data = files.map((f) => `${rawBase}/${f}`);
  const json = {
    status: true,
    creator: 'yasamDev',
    total: data.length,
    data,
  };
  fs.writeFileSync(path.join(folderDir, 'api.json'), JSON.stringify(json, null, 2));
  return json;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = req.headers['x-terminal-token'];
  if (!process.env.TERMINAL_TOKEN) {
    res.status(500).json({ error: 'TERMINAL_TOKEN belum di-set di Environment Variables Vercel.' });
    return;
  }
  if (token !== process.env.TERMINAL_TOKEN) {
    res.status(401).json({ error: 'Token salah.' });
    return;
  }

  const { folder, files } = req.body || {};
  if (!folder || typeof folder !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(folder)) {
    res.status(400).json({ error: 'Nama folder wajib diisi, hanya huruf/angka/-/_ .' });
    return;
  }
  if (!Array.isArray(files) || files.length === 0) {
    res.status(400).json({ error: 'Tidak ada file yang dikirim.' });
    return;
  }

  try {
    await ensureRepo();

    const folderDir = path.join(WORK_DIR, folder);
    fs.mkdirSync(folderDir, { recursive: true });

    let counter = nextCounter(folderDir);
    const added = [];

    for (const f of files) {
      if (!f.name || !f.dataBase64) continue;
      const ext = (f.name.split('.').pop() || 'bin').toLowerCase();
      const newName = `${String(counter).padStart(3, '0')}.${ext}`;
      const buffer = Buffer.from(f.dataBase64, 'base64');
      fs.writeFileSync(path.join(folderDir, newName), buffer);
      added.push(newName);
      counter++;
    }

    const apiJson = regenerateApiJson(folderDir, folder);

    await run('git add .', WORK_DIR);
    try {
      await run(`git commit -m "upload ${folder} ${new Date().toISOString()}"`, WORK_DIR);
    } catch (e) {
      // tidak ada perubahan untuk di-commit, lanjut saja
    }
    await run(`git push origin ${BRANCH}`, WORK_DIR);

    res.status(200).json({
      ok: true,
      added,
      total: apiJson.total,
      apiUrl: `https://raw.githubusercontent.com/${OWNER}/${REPO_NAME}/${BRANCH}/${folder}/api.json`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
};
