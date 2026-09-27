// Versi ini TIDAK memakai binary `git` (tidak tersedia di runtime serverless
// Vercel). Semua operasi dilakukan lewat GitHub REST API (Contents API)
// menggunakan fetch bawaan Node 18+.

const OWNER = process.env.REPO_OWNER || 'Yasamsen';
const REPO_NAME = process.env.REPO_NAME || 'media-repo';
const BRANCH = process.env.REPO_BRANCH || 'main';
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO_NAME}`;

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'web-terminal-uploader',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// Ambil isi folder. Return [] kalau folder belum ada (404).
async function listFolder(folder) {
  const url = `${API_BASE}/contents/${encodeURIComponent(folder)}?ref=${BRANCH}`;
  const r = await fetch(url, { headers: ghHeaders() });
  if (r.status === 404) return [];
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Gagal baca folder (${r.status}): ${body}`);
  }
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

function nextCounter(existingFiles) {
  const names = existingFiles.map((f) => f.name).filter((n) => /^[0-9]{3}\./.test(n));
  if (names.length === 0) return 1;
  names.sort();
  const last = names[names.length - 1];
  return parseInt(last.slice(0, 3), 10) + 1;
}

// Buat / timpa satu file lewat Contents API.
async function putFile(folder, filename, base64Content, message, existingSha) {
  const url = `${API_BASE}/contents/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
  const body = {
    message,
    content: base64Content,
    branch: BRANCH,
  };
  if (existingSha) body.sha = existingSha;

  const r = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errBody = await r.text();
    throw new Error(`Gagal upload ${filename} (${r.status}): ${errBody}`);
  }
  return r.json();
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
  if (!process.env.GITHUB_TOKEN) {
    res.status(500).json({ error: 'GITHUB_TOKEN belum di-set di Environment Variables Vercel.' });
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
    const existing = await listFolder(folder);
    let counter = nextCounter(existing);
    const added = [];

    // Upload tiap file satu-satu (tiap file = 1 commit lewat Contents API)
    for (const f of files) {
      if (!f.name || !f.dataBase64) continue;
      const ext = (f.name.split('.').pop() || 'bin').toLowerCase();
      const newName = `${String(counter).padStart(3, '0')}.${ext}`;
      await putFile(folder, newName, f.dataBase64, `upload ${folder}/${newName}`);
      added.push(newName);
      counter++;
    }

    // Susun ulang daftar file di folder (existing + baru) untuk api.json
    const afterUpload = await listFolder(folder);
    const mediaFiles = afterUpload
      .map((f) => f.name)
      .filter((n) => /\.(jpg|jpeg|png|webp|mp4)$/i.test(n))
      .sort();

    const rawBase = `https://raw.githubusercontent.com/${OWNER}/${REPO_NAME}/${BRANCH}/${folder}`;
    const apiJson = {
      status: true,
      creator: 'yasamDev',
      total: mediaFiles.length,
      data: mediaFiles.map((n) => `${rawBase}/${n}`),
    };

    const existingApiJson = afterUpload.find((f) => f.name === 'api.json');
    const apiJsonBase64 = Buffer.from(JSON.stringify(apiJson, null, 2)).toString('base64');
    await putFile(
      folder,
      'api.json',
      apiJsonBase64,
      `update api.json ${folder}`,
      existingApiJson ? existingApiJson.sha : undefined
    );

    res.status(200).json({
      ok: true,
      added,
      total: apiJson.total,
      apiUrl: `${rawBase}/api.json`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
};
