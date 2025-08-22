import React, { useState, useEffect } from 'react';

const ShareModal = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setMobile('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
      <div className="bg-white text-black rounded-2xl shadow-xl w-[90%] max-w-[520px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold font-brand">Share your room</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/30 text-black placeholder-gray-500"
              placeholder="Your name"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/30 text-black placeholder-gray-500"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Mobile</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/30 text-black placeholder-gray-500"
              placeholder="WhatsApp number"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-black"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm && onConfirm({ name, email, mobile })}
            className="px-4 py-2 rounded-xl bg-black text-white hover:bg-black/90"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;


