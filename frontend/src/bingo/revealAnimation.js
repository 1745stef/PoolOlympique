// Animation « baguette magique » jouée quand un admin révèle une case (vue joueur).
// Source : LottieFiles. Pour ne plus dépendre de lottie.host, télécharge le JSON dans
// frontend/public/lottie/reveal.json puis remplace l'URL ci-dessous par '/lottie/reveal.json'.
export const REVEAL_LOTTIE_URL =
  'https://lottie.host/b277afe5-43af-46fe-80bd-66192bbf1dd5/hjQDoogCn4.json';

// Sécurité : si l'animation ne signale pas sa fin, on révèle quand même la case
export const REVEAL_MAX_MS = 3000;

let cache = null;
// Charge le JSON une seule fois (partagé par toutes les cases). null si échec → pas d'animation.
export function loadRevealAnimation() {
  if (!cache) {
    cache = fetch(REVEAL_LOTTIE_URL)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(() => { cache = null; return null; });
  }
  return cache;
}

// Librairie lottie-web chargée à la demande depuis un CDN (aucune dépendance npm).
const LOTTIE_LIB_URL = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';
let libPromise = null;
function loadLottieLib() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.lottie) return Promise.resolve(window.lottie);
  if (!libPromise) {
    libPromise = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = LOTTIE_LIB_URL;
      s.async = true;
      s.onload = () => resolve(window.lottie || null);
      s.onerror = () => { libPromise = null; resolve(null); };
      document.head.appendChild(s);
    });
  }
  return libPromise;
}

// { lib, data } prêt à jouer, ou null si quelque chose n'a pas pu se charger (→ pas d'animation)
export async function loadRevealAssets() {
  const [lib, data] = await Promise.all([loadLottieLib(), loadRevealAnimation()]);
  return lib && data ? { lib, data } : null;
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
