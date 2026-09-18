/**
 * drive.service.js
 * Google Drive integration layer.
 * When GOOGLE_SERVICE_ACCOUNT_JSON env var is set AND DRIVE_FILE_ID / DRIVE_FOLDER_ID are set,
 * all reads/writes go to Google Drive. Otherwise falls back to local Excel.
 *
 * Setup:
 *  1. Create a Google Cloud project, enable Drive API + Sheets API.
 *  2. Create a Service Account, download JSON key.
 *  3. Share the Drive Excel file (DRIVE_FILE_ID) and images folder (DRIVE_FOLDER_ID)
 *     with the service account email (Editor access).
 *  4. Set env vars:
 *       GOOGLE_SERVICE_ACCOUNT_JSON=<contents of JSON key file, base64 or raw JSON string>
 *       DRIVE_FILE_ID=1Crgw70m9nfN_CaLy-24VUQjHs8cMbw9k
 *       DRIVE_FOLDER_ID=1c124sGpFDaxVbEiKipJTQ1qePNKljW0y
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DRIVE_FILE_ID = process.env.DRIVE_FILE_ID || '';
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '';
const SA_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';

const DRIVE_ENABLED = !!(DRIVE_FILE_ID && DRIVE_FOLDER_ID && SA_JSON);

let _auth = null;
let _drive = null;

function getAuth() {
  if (_auth) return _auth;
  let creds;
  try {
    const raw = SA_JSON.startsWith('{') ? SA_JSON : Buffer.from(SA_JSON, 'base64').toString('utf8');
    creds = JSON.parse(raw);
  } catch (e) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: ' + e.message);
  }
  _auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  _drive = google.drive({ version: 'v3', auth: _auth });
  return _auth;
}

function getDrive() {
  getAuth();
  return _drive;
}

// Retry wrapper for transient errors
async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e) {
      const isRetryable = e.code === 429 || e.code === 503 || (e.message && e.message.includes('ECONNRESET'));
      if (i < retries - 1 && isRetryable) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      } else throw e;
    }
  }
}

/**
 * Download the Drive Excel file to a temp path and return that path.
 * Caller is responsible for cleanup.
 */
async function downloadExcelToTemp() {
  if (!DRIVE_ENABLED) return null;
  const drive = getDrive();
  const tmpPath = path.join(os.tmpdir(), `tpl2026_${Date.now()}.xlsx`);
  const dest = fs.createWriteStream(tmpPath);
  await withRetry(async () => {
    const res = await drive.files.get(
      { fileId: DRIVE_FILE_ID, alt: 'media' },
      { responseType: 'stream' }
    );
    await new Promise((resolve, reject) => {
      res.data.pipe(dest);
      res.data.on('end', resolve);
      res.data.on('error', reject);
    });
  });
  return tmpPath;
}

/**
 * Upload a local file to Drive, replacing the existing file content.
 */
async function uploadExcelToDrive(localPath) {
  if (!DRIVE_ENABLED) return;
  const drive = getDrive();
  await withRetry(() => drive.files.update({
    fileId: DRIVE_FILE_ID,
    media: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', body: fs.createReadStream(localPath) }
  }));
}

/**
 * Upload an image buffer/stream to the Drive images folder.
 * Returns { id, webViewLink, webContentLink } of the created file.
 */
async function uploadImageToDrive(fileBuffer, filename, mimeType) {
  if (!DRIVE_ENABLED) return null;
  const drive = getDrive();
  const { Readable } = require('stream');
  const stream = Readable.from(fileBuffer);
  const res = await withRetry(() => drive.files.create({
    requestBody: { name: filename, parents: [DRIVE_FOLDER_ID] },
    media: { mimeType, body: stream },
    fields: 'id,webViewLink,webContentLink'
  }));
  // Make publicly viewable
  await withRetry(() => drive.permissions.create({
    fileId: res.data.id,
    requestBody: { role: 'reader', type: 'anyone' }
  }));
  return res.data;
}

/**
 * Delete a file from Drive by its file ID.
 */
async function deleteImageFromDrive(fileId) {
  if (!DRIVE_ENABLED || !fileId) return;
  const drive = getDrive();
  await withRetry(() => drive.files.delete({ fileId })).catch(e => console.error('Drive delete error:', e.message));
}

/**
 * List all files in the Drive images folder.
 */
async function listDriveImages() {
  if (!DRIVE_ENABLED) return [];
  const drive = getDrive();
  const res = await withRetry(() => drive.files.list({
    q: `'${DRIVE_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,size,createdTime,webViewLink,webContentLink)',
    pageSize: 1000
  }));
  return res.data.files || [];
}

/**
 * Get a public image URL from a Drive file ID.
 * Uses the thumbnail/export URL that works without login.
 */
function getDriveImageUrl(fileId) {
  if (!fileId) return '';
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

module.exports = {
  DRIVE_ENABLED,
  downloadExcelToTemp,
  uploadExcelToDrive,
  uploadImageToDrive,
  deleteImageFromDrive,
  listDriveImages,
  getDriveImageUrl
};
