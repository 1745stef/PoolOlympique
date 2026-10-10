// Animations du Bingo (Lottie / dotLottie, hébergées sur lottie.host).
// Pour ne plus dépendre de lottie.host : télécharge les fichiers dans
// frontend/public/lottie/ et remplace les URLs ci-dessous par '/lottie/<fichier>'.
export const ANIM = {
  waiting:  'https://lottie.host/c531abd5-9a20-44df-811b-1387ac307e36/3tzcVG6iRm.lottie', // sphère d'attente (boucle)
  confetti: 'https://lottie.host/d4b01bef-1533-4283-88dc-7756ef29b719/3x1UuftmXL.lottie', // ouverture de la grille
  reveal:   'https://lottie.host/b277afe5-43af-46fe-80bd-66192bbf1dd5/hjQDoogCn4.json',   // baguette magique (révélation d'une case)
};

// Sécurités : si une animation ne signale pas sa fin, on continue quand même
export const REVEAL_MAX_MS   = 3000;
export const CONFETTI_MAX_MS = 6000;
export const INTRO_MS        = 1800;   // durée de l'apparition « zoom depuis le centre »

// Lecteur officiel dotLottie (lit .lottie et .json), chargé à la demande depuis un CDN :
// aucune dépendance npm. Pour figer une version : ...dotlottie-web@X.Y.Z/+esm
const DOTLOTTIE_URL = 'https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm';
let libPromise = null;
export function loadDotLottie() {
  if (!libPromise) {
    libPromise = import(/* @vite-ignore */ DOTLOTTIE_URL)
      .then(m => m.DotLottie || null)
      .catch(() => { libPromise = null; return null; });
  }
  return libPromise;
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
