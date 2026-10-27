import { useEffect } from 'react';
import Icon from './Icons.jsx';
export default function Sheet({ title, onClose, children, label }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <>
      <div className="backdrop sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label || title}>
        <div className="grab" />
        <div className="row between" style={{ marginBottom: 6, flexWrap: 'nowrap' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </>
  );
}
