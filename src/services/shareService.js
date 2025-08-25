// Service to share the composed room image and user details
// Endpoint expects multipart/form-data with fields:
// - name (text)
// - email (text)
// - contact_number (text)
// - share (file)

const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL)
  ? process.env.REACT_APP_API_BASE_URL.replace(/\/$/, '')
  : 'http://localhost:15205/api/v1';

export async function shareModel({ name, email, contactNumber, file }) {
  const form = new FormData();
  form.append('name', name || '');
  form.append('email', email || '');
  form.append('contact_number', contactNumber || '');
  if (file) form.append('share', file);

  const res = await fetch(`${API_BASE_URL}/share`, {
    method: 'POST',
    body: form,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {}

  if (!res.ok) {
    const message = data?.message || `Failed to share (HTTP ${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data || { status: 'Success', message: 'Successfully Shared Model' };
}

const ShareService = { shareModel };
export default ShareService;

