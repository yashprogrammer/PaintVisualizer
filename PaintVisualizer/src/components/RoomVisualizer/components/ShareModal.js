import React from 'react';
import ShareService from '../../../services/shareService';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const ShareModal = ({ isOpen, onClose, onConfirm, buildImageBlob }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [agree, setAgree] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(null);
  const [serverError, setServerError] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setName('');
      setEmail('');
      setContact('');
      setAgree(false);
      setErrors({});
      setLoading(false);
      setSuccess(null);
      setServerError('');
    }
  }, [isOpen]);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!emailRegex.test(email.trim())) next.email = 'Enter a valid email';
    if (!contact.trim()) next.contact = 'Contact number is required';
    if (!agree) next.agree = 'You must accept Terms & Conditions';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    try {
      setLoading(true);
      const blob = typeof buildImageBlob === 'function' ? await buildImageBlob() : null;
      // Prefer JPEG; fallback to PNG if blob type not set
      const fileName = 'Pic.jpg';
      const file = blob ? new File([blob], fileName, { type: blob.type || 'image/jpeg' }) : null;

      const res = await ShareService.shareModel({
        name: name.trim(),
        email: email.trim(),
        contactNumber: contact.trim(),
        file,
      });
      setSuccess(res?.message || 'Successfully Shared Model');
      if (typeof onConfirm === 'function') {
        onConfirm({ name, email, contact });
      }
    } catch (err) {
      setServerError(err?.message || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="bg-white w-[min(92vw,520px)] rounded-2xl shadow-xl p-5">
        <div className="flex items-start justify-between">
          <h3 className="m-0 font-semibold text-[20px]">Share Model</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        {success ? (
          <div className="mt-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-green-800">
              {success}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-black text-white rounded-lg">Close</button>
            </div>
          </div>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                placeholder="Your name"
                disabled={loading}
              />
              {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                placeholder="name@example.com"
                disabled={loading}
              />
              {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
            </div>
            <div>
              <label className="block text-sm mb-1">Contact number</label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                placeholder="Phone number"
                disabled={loading}
              />
              {errors.contact && <div className="text-red-600 text-sm mt-1">{errors.contact}</div>}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                id="agree"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="agree" className="text-sm">
                I agree to the <a href="/terms" className="underline">Terms & Conditions</a>
              </label>
            </div>
            {errors.agree && <div className="text-red-600 text-sm">{errors.agree}</div>}

            {serverError && (
              <div className="rounded bg-red-50 border border-red-200 p-2 text-red-700">{serverError}</div>
            )}

            <div className="mt-3 flex items-center justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300" disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-black text-white disabled:opacity-50"
                disabled={loading || !agree}
              >
                {loading ? 'Sharing…' : 'Share'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShareModal;

