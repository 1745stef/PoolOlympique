import { useEffect, useRef } from 'react';

// Joue l'animation Lottie une fois dans la case, puis appelle onDone.
export default function RevealCast({ lib, data, onDone }) {
  const box = useRef(null);
  useEffect(() => {
    const anim = lib.loadAnimation({
      container: box.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: JSON.parse(JSON.stringify(data)), // copie : lottie peut modifier l'objet
    });
    anim.addEventListener('complete', onDone);
    return () => anim.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={box} className="bingo-cast-box" />;
}
