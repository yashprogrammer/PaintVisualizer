// Lightweight service dedicated to the Share flow
// Sends multipart/form-data to POST /share with fields:
// - name (text)
// - email (text)
// - contact_number (text)
// - share (file)

const getBaseUrl = () => {
  // Prefer explicit env var if provided; otherwise relative path
  const fromEnv = typeof process !== 'undefined' ? process.env.REACT_APP_API_BASE_URL : undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim().replace(/\/$/, '');
  return '';
};

export async function shareModel({ name, email, contactNumber, file }) {
  const form = new FormData();
  form.append('name', name || '');
  form.append('email', email || '');
  form.append('contact_number', contactNumber || '');
  if (file) {
    form.append('share', file);
  }

  const res = await fetch(`${getBaseUrl()}/share`, {
    method: 'POST',
    body: form,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // No JSON body; normalize into an error
  }

  if (!res.ok) {
    const message = data?.message || `Failed to share (HTTP ${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data || { status: 'Success' };
}

const ShareService = { shareModel };
export default ShareService;

