import React, { useState, useEffect } from 'react';
import ShareService from '../../../services/shareService';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const ShareModal = ({ isOpen, onClose, onConfirm, buildImageBlob }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setMobile('');
      setAgree(false);
      setErrors({});
      setLoading(false);
      setServerError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!emailRegex.test(email.trim())) next.email = 'Invalid email';
    if (!mobile.trim()) next.mobile = 'Contact number is required';
    if (!agree) next.agree = 'Please accept Terms & Conditions';
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
      const file = blob ? new File([blob], 'Pic.jpg', { type: blob.type || 'image/jpeg' }) : null;
      const res = await ShareService.shareModel({
        name: name.trim(),
        email: email.trim(),
        contactNumber: mobile.trim(),
        file,
      });
      setSuccessMsg(res?.message || 'Successfully Shared Model');
      if (onConfirm) onConfirm({ name, email, mobile });
    } catch (err) {
      setServerError(err?.message || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
      <div className="bg-white text-black rounded-2xl shadow-xl w-[90%] max-w-[520px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold font-brand">Share your room</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {successMsg ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 text-green-800 p-3">
              {successMsg}
            </div>
            <div className="flex justify-end">
              <button type="button" className="px-4 py-2 rounded-xl bg-black text-white" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/30 text-black placeholder-gray-500"
                placeholder="Your name"
                disabled={loading}
              />
              {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/30 text-black placeholder-gray-500"
                placeholder="you@example.com"
                disabled={loading}
              />
              {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Mobile</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/30 text-black placeholder-gray-500"
                placeholder="WhatsApp number"
                disabled={loading}
              />
              {errors.mobile && <div className="text-red-600 text-sm mt-1">{errors.mobile}</div>}
            </div>

            <div className="flex items-start gap-2">
              <input id="agree" type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} disabled={loading} />
              <label htmlFor="agree" className="text-sm">I agree to the <a href="/terms" className="underline">Terms & Conditions</a></label>
            </div>
            {errors.agree && <div className="text-red-600 text-sm">{errors.agree}</div>}

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-2">{serverError}</div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-black"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-50"
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
