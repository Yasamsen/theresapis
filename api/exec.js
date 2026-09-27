const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Workspace persisten SELAMA instance function masih "hangat".
// Begitu Vercel mendaur ulang instance (cold start), folder ini akan kosong lagi.
const WORKDIR = '/tmp/workspace';
if (!fs.existsSync(WORKDIR)) {
  fs.mkdirSync(WORKDIR, { recursive: true });
}

// Simpan cwd relatif di memori proses (bertahan selama instance hangat)
let currentDir = WORKDIR;

function safeResolve(base, target) {
  const resolved = path.resolve(base, target);
  // Cegah command "keluar" dari /tmp lewat cd ../../..
  if (!resolved.startsWith('/tmp')) {
    return base;
  }
  return resolved;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // --- AUTH SEDERHANA ---
  const token = req.headers['x-terminal-token'];
  if (!process.env.TERMINAL_TOKEN) {
    res.status(500).json({ error: 'TERMINAL_TOKEN belum di-set di Environment Variables Vercel.' });
    return;
  }
  if (token !== process.env.TERMINAL_TOKEN) {
    res.status(401).json({ error: 'Token salah.' });
    return;
  }

  const { command } = req.body || {};
  if (!command || typeof command !== 'string') {
    res.status(400).json({ error: 'Command kosong.' });
    return;
  }

  const trimmed = command.trim();

  // Tangani "cd" secara manual, karena tiap exec() jalan di child process baru
  // sehingga perubahan directory normal tidak akan "nempel" ke command berikutnya.
  if (trimmed === 'cd' || trimmed.startsWith('cd ')) {
    const target = trimmed === 'cd' ? WORKDIR : trimmed.slice(3).trim();
    const newDir = target.startsWith('/')
      ? safeResolve('/tmp', target)
      : safeResolve(currentDir, target);

    if (!fs.existsSync(newDir) || !fs.statSync(newDir).isDirectory()) {
      res.status(200).json({
        stdout: '',
        stderr: `cd: no such file or directory: ${target}`,
        cwd: currentDir.replace('/tmp/workspace', '~') || '~',
      });
      return;
    }
    currentDir = newDir;
    res.status(200).json({ stdout: '', stderr: '', cwd: currentDir.replace('/tmp/workspace', '~') || '~' });
    return;
  }

  exec(trimmed, { cwd: currentDir, timeout: 55000, maxBuffer: 5 * 1024 * 1024, shell: '/bin/bash' }, (error, stdout, stderr) => {
    res.status(200).json({
      stdout: stdout || '',
      stderr: error ? (stderr || error.message) : stderr || '',
      cwd: currentDir.replace('/tmp/workspace', '~') || '~',
    });
  });
};
