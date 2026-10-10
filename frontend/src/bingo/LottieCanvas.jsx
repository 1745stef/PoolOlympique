import { useEffect, useRef } from 'react';
import { loadDotLottie } from './animations';

// Joue une animation .lottie / .json dans un <canvas> qui remplit son parent.
// onComplete : fin de l'animation (si loop=false). onError : chargement impossible.
export default function LottieCanvas({ src, loop = false, onComplete, onError, className = '', maxSize = 800 }) {
  const canvasRef = useRef(null);
  const cb = useRef({});
  cb.current = { onComplete, onError };

  useEffect(() => {
    let inst = null;
    let cancelled = false;
    loadDotLottie().then(DotLottie => {
      if (cancelled) return;
      if (!DotLottie) { cb.current.onError?.(); return; }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = Math.min(maxSize, Math.round((canvas.clientWidth  || 300) * dpr));
      canvas.height = Math.min(maxSize, Math.round((canvas.clientHeight || 300) * dpr));
      try {
        inst = new DotLottie({ canvas, src, loop, autoplay: true });
        inst.addEventListener('complete', () => cb.current.onComplete?.());
        inst.addEventListener('loadError', () => cb.current.onError?.());
      } catch { cb.current.onError?.(); }
    });
    return () => { cancelled = true; try { inst?.destroy(); } catch {} };
  }, [src, loop, maxSize]);

  return <canvas ref={canvasRef} className={`bingo-lottie ${className}`} />;
}
