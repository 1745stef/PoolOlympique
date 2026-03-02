import { useState, useRef, useEffect, useCallback } from 'react';

const CIRCLE_SIZE = 220; // taille d'affichage du cercle dans l'UI

export default function ImageCropper({ imageSrc, onCrop, onCancel }) {
  const canvasRef   = useRef(null);
  const containerRef = useRef(null);
  const [imgEl, setImgEl] = useState(null);

  // Position et zoom de l'image dans le cercle
  const stateRef = useRef({ x: 0, y: 0, scale: 1 });
  const [scale, setScale] = useState(1);
  const [scaleMin, setScaleMin] = useState(1);

  // Drag state
  const dragRef = useRef(null);

  // Charger l'image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // évite le canvas taint si URL externe
    img.onload = () => {
      // Zoom de départ = couvre le cercle. Minimum = 20% du zoom de départ (peut réduire)
      const coverS = Math.max(CIRCLE_SIZE / img.width, CIRCLE_SIZE / img.height);
      const minS = coverS * 0.2;
      stateRef.current = {
        x: -(img.width  * coverS - CIRCLE_SIZE) / 2,
        y: -(img.height * coverS - CIRCLE_SIZE) / 2,
        scale: coverS,
      };
      setScaleMin(minS);
      setScale(coverS);
      setImgEl(img);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Dessiner sur le canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;
    const ctx = canvas.getContext('2d');
    const { x, y, scale: s } = stateRef.current;
    ctx.clearRect(0, 0, CIRCLE_SIZE, CIRCLE_SIZE);
    ctx.drawImage(imgEl, x, y, imgEl.width * s, imgEl.height * s);
  }, [imgEl]);

  useEffect(() => { draw(); }, [draw, scale]);

  // ── Drag souris ────────────────────────────────────────
  const onMouseDown = (e) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: stateRef.current.x, oy: stateRef.current.y };
  };
  const onMouseMove = useCallback((e) => {
    if (!dragRef.current || !imgEl) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    clampAndSet(dragRef.current.ox + dx, dragRef.current.oy + dy);
  }, [imgEl, scale]);
  const onMouseUp = () => { dragRef.current = null; };

  // ── Touch ──────────────────────────────────────────────
  const touchRef = useRef(null);
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, ox: stateRef.current.x, oy: stateRef.current.y, mode: 'pan' };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      touchRef.current = { startDist: dist, startScale: stateRef.current.scale, mode: 'pinch' };
    }
  };
  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!touchRef.current || !imgEl) return;
    if (touchRef.current.mode === 'pan' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchRef.current.startX;
      const dy = e.touches[0].clientY - touchRef.current.startY;
      clampAndSet(touchRef.current.ox + dx, touchRef.current.oy + dy);
    } else if (touchRef.current.mode === 'pinch' && e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const newScale = Math.max(scaleMin, touchRef.current.startScale * (dist / touchRef.current.startDist));
      applyScale(newScale);
    }
  }, [imgEl, scaleMin]);
  const onTouchEnd = () => { touchRef.current = null; };

  // ── Molette ────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.93 : 1.07;
    applyScale(Math.max(scaleMin, stateRef.current.scale * delta));
  }, [scaleMin]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [onWheel, onTouchMove]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove]);

  // ── Helpers ────────────────────────────────────────────
  const clampAndSet = (nx, ny) => {
    if (!imgEl) return;
    const s = stateRef.current.scale;
    const imgW = imgEl.width  * s;
    const imgH = imgEl.height * s;
    // Si l'image est plus grande que le cercle : la garder dans les limites
    // Si l'image est plus petite : la laisser libre
    const clampX = imgW  >= CIRCLE_SIZE;
    const clampY = imgH >= CIRCLE_SIZE;
    const minX = CIRCLE_SIZE - imgW,  maxX = 0;
    const minY = CIRCLE_SIZE - imgH, maxY = 0;
    stateRef.current.x = clampX ? Math.min(maxX, Math.max(minX, nx)) : nx;
    stateRef.current.y = clampY ? Math.min(maxY, Math.max(minY, ny)) : ny;
    draw();
  };

  const applyScale = (newScale) => {
    if (!imgEl) return;
    // Zoom centré sur le milieu du cercle
    const cx = CIRCLE_SIZE / 2;
    const cy = CIRCLE_SIZE / 2;
    const ratio = newScale / stateRef.current.scale;
    const nx = cx - (cx - stateRef.current.x) * ratio;
    const ny = cy - (cy - stateRef.current.y) * ratio;
    stateRef.current.scale = newScale;
    setScale(newScale);
    clampAndSet(nx, ny);
  };

  const handleSlider = (e) => {
    applyScale(parseFloat(e.target.value));
  };

  // ── Export crop ────────────────────────────────────────
  const handleCrop = () => {
    if (!imgEl) return;
    const out = document.createElement('canvas');
    const SIZE = 200; // résolution finale = taille avatar dans le menu (~32-44px affiché)
    out.width = SIZE; out.height = SIZE;
    const ctx = out.getContext('2d');

    // Clip circulaire
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // Ratio entre la taille de sortie et l'affichage
    const ratio = SIZE / CIRCLE_SIZE;
    const { x, y, scale: s } = stateRef.current;
    ctx.drawImage(imgEl, x * ratio, y * ratio, imgEl.width * s * ratio, imgEl.height * s * ratio);

    out.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1];
        onCrop(base64, 'image/png');
      };
      reader.readAsDataURL(blob);
    }, 'image/png');
  };

  if (!imgEl) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: CIRCLE_SIZE, color: 'var(--muted)' }}>
      Chargement...
    </div>
  );

  return (
    <div className="cropper-wrap" ref={containerRef}>
      <p className="cropper-hint">Déplace · molette ou pincer pour zoomer</p>

      {/* Canvas avec masque circulaire */}
      <div className="cropper-circle-wrap" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
        <canvas
          ref={canvasRef}
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          className="cropper-canvas"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
        />
        {/* Overlay avec trou circulaire */}
        <div className="cropper-overlay" />
        {/* Anneau de bordure */}
        <div className="cropper-ring" />
      </div>

      {/* Slider zoom */}
      <div className="cropper-slider-row">
        <span style={{ fontSize: '0.8rem' }}>🔍</span>
        <input
          type="range" min={scaleMin} max={scaleMin * 20} step={scaleMin * 0.01}
          value={scale}
          onChange={handleSlider}
          className="cropper-slider"
        />
        <span style={{ fontSize: '0.95rem' }}>🔍</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Annuler</button>
        <button className="btn-primary"   onClick={handleCrop} style={{ flex: 1 }}>✓ Utiliser cette photo</button>
      </div>
    </div>
  );
}
