import { useEffect, useState } from 'react';

export function useFirstInteraction() {
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) return;
    const handler = () => setHasInteracted(true);
    const opts = { passive: true };
    window.addEventListener('pointerdown', handler, opts);
    window.addEventListener('click', handler, opts);
    window.addEventListener('keydown', handler, opts);
    window.addEventListener('touchstart', handler, opts);
    return () => {
      window.removeEventListener('pointerdown', handler, opts);
      window.removeEventListener('click', handler, opts);
      window.removeEventListener('keydown', handler, opts);
      window.removeEventListener('touchstart', handler, opts);
    };
  }, [hasInteracted]);

  return hasInteracted;
}


