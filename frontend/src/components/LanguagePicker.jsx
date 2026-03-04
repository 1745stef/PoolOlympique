import { useState } from 'react';
import { LANGUAGES } from '../data/i18n';
import { useLang } from '../hooks/useLanguage';

// URLs des drapeaux via flagcdn.com (CDN public fiable, codes ISO alpha-2)
const FLAG_URLS = {
  'fr-fr': 'https://flagcdn.com/w40/fr.png',
  'en-us': 'https://flagcdn.com/w40/us.png',
  'en-gb': 'https://flagcdn.com/w40/gb.png',
  'en-ca': 'https://flagcdn.com/w40/ca.png',
};

// SVG drapeau du Québec (pas de drapeau dans l'API Codante)
function QuebecFlag({ size = 20 }) {
  const Fleur = ({ x, y }) => (
    <g transform={`translate(${x},${y})`} fill="white">
      <ellipse cx="0" cy="0" rx="2" ry="4"/>
      <ellipse cx="-3" cy="2" rx="1.5" ry="3" transform="rotate(-30)"/>
      <ellipse cx="3" cy="2" rx="1.5" ry="3" transform="rotate(30)"/>
      <rect x="-1.5" y="3" width="3" height="2"/>
    </g>
  );
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 60 36" xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: 2, flexShrink: 0, display: 'block' }}>
      <rect width="60" height="36" fill="#003DA5"/>
      <rect x="26" y="0" width="8" height="36" fill="white"/>
      <rect x="0" y="14" width="60" height="8" fill="white"/>
      <Fleur x={13} y={7}/>
      <Fleur x={47} y={7}/>
      <Fleur x={13} y={29}/>
      <Fleur x={47} y={29}/>
    </svg>
  );
}

export function LangFlag({ code, size = 20 }) {
  if (code === 'fr-ca') return <QuebecFlag size={size} />;
  const url = FLAG_URLS[code];
  if (url) return (
    <img src={url} alt={code} style={{ width: size * (4/3), height: size * 0.9, objectFit: 'cover', borderRadius: 2, flexShrink: 0, display: 'block' }} />
  );
  return <span style={{ fontSize: size * 0.9, lineHeight: 1, flexShrink: 0 }}>🌐</span>;
}

export default function LanguagePickerModal({ onClose }) {
  const { lang, setLangAndSave, t } = useLang();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSelect = async (code) => {
    if (code === lang) { onClose(); return; }
    setSaving(true);
    await setLangAndSave(code);
    setSaved(true);
    setTimeout(onClose, 900);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box lang-modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>{t('languageModalTitle')}</h3>

        {saved ? (
          <p style={{ color: '#4ade80', textAlign: 'center', padding: '12px 0', fontSize: '1rem' }}>
            {t('languageSaved')}
          </p>
        ) : (
          <div className="lang-options">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={`lang-option ${lang === l.code ? 'active' : ''}`}
                onClick={() => handleSelect(l.code)}
                disabled={saving}
              >
                <LangFlag code={l.code} size={28} />
                <span className="lang-option-label">{l.label}</span>
                {lang === l.code && <span className="lang-check">✓</span>}
              </button>
            ))}
          </div>
        )}

        {saving && !saved && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '0.8rem', marginTop: 8 }}>
            {t('languageSaving')}
          </p>
        )}
      </div>
    </div>
  );
}
