#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const DEFAULT_ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.GIL_ADMIN_TOKEN || '';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

function usage() {
  console.log('Usage: node scripts/manageCameras.js <action> [file]');
  console.log('Actions:');
  console.log('  list                 - list cameras');
  console.log('  delete-all           - delete all cameras (requires ADMIN_TOKEN)');
  console.log('  create-from-file f   - create cameras from JSON file');
  console.log('  reset f              - delete-all then create-from-file f');
  console.log('Environment variables: BACKEND_URL (default http://localhost:8000), ADMIN_TOKEN');
}

async function ensureFetch() {
  if (typeof fetch === 'undefined') {
    if (globalThis && globalThis.fetch) return;
    console.error('Global fetch is not available in this Node runtime. Use Node 18+ or run with a fetch polyfill.');
    process.exit(1);
  }
}

async function fetchCameras() {
  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/cameras`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET /api/cameras failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

async function deleteCamera(cameraId, token) {
  const url = `${BACKEND_URL.replace(/\/$/, '')}/api/cameras/${encodeURIComponent(cameraId)}`;
  const res = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(token ? { 'x-admin-token': token } : {}) } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DELETE ${cameraId} failed: ${res.status} ${res.statusText} ${text}`);
  }
  return await res.json();
}

async function createCamera(cameraObj, token) {
  const url = `${BACKEND_URL.replace(/\/$/, '')}/api/cameras`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'x-admin-token': token } : {}) }, body: JSON.stringify(cameraObj) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST create camera failed: ${res.status} ${res.statusText} ${text}`);
  }
  return await res.json();
}

async function loginAdmin() {
  const url = `${BACKEND_URL.replace(/\/$/, '')}/api/admin/login`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Admin login failed: ${res.status} ${res.statusText} ${text}`);
  }
  const payload = await res.json();
  if (!payload || !payload.ok || !payload.token) {
    throw new Error(`Admin login did not return token: ${JSON.stringify(payload)}`);
  }
  return payload.token;
}

async function main() {
  await ensureFetch();

  const action = process.argv[2];
  const file = process.argv[3];

  if (!action) {
    usage();
    process.exit(1);
  }

  try {
    if (action === 'list') {
      const data = await fetchCameras();
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    if (action === 'delete-all' || action === 'reset') {
      let adminToken = DEFAULT_ADMIN_TOKEN;
      if (!adminToken) {
        try {
          console.log('No ADMIN_TOKEN provided; attempting login with default credentials...');
          adminToken = await loginAdmin();
          console.log('Obtained admin token via login.');
        } catch (e) {
          console.error('Failed to obtain admin token:', e.message || e);
          process.exit(1);
        }
      }

      const data = await fetchCameras();
      const items = data.items || [];
      console.log(`Found ${items.length} cameras. Deleting...`);

      for (const cam of items) {
        try {
          await deleteCamera(cam.cameraId, adminToken);
          console.log(`Deleted ${cam.cameraId}`);
        } catch (e) {
          console.error(`Failed to delete ${cam.cameraId}:`, e.message || e);
        }
      }

      if (action === 'delete-all') return;

      // if action === reset continue to create
    }

    if (action === 'create-from-file' || action === 'reset') {
      if (!file) {
        console.error('Missing file argument for create-from-file/reset');
        process.exit(1);
      }

      const filePath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) {
        console.error('Expected a JSON array in the file');
        process.exit(1);
      }

      let adminToken = DEFAULT_ADMIN_TOKEN;
      if (!adminToken) {
        try {
          console.log('No ADMIN_TOKEN provided; attempting login with default credentials...');
          adminToken = await loginAdmin();
          console.log('Obtained admin token via login.');
        } catch (e) {
          console.error('Failed to obtain admin token:', e.message || e);
          process.exit(1);
        }
      }

      console.log(`Creating ${list.length} cameras from ${file}`);
      for (const cam of list) {
        try {
          const result = await createCamera(cam, adminToken);
          console.log('Created', result.item?.cameraId ?? cam.cameraId ?? JSON.stringify(result));
        } catch (e) {
          console.error('Create failed for', cam.cameraId ?? cam.streamId ?? '(unknown)', e.message || e);
        }
      }

      return;
    }

    console.error('Unknown action:', action);
    usage();
    process.exit(1);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
