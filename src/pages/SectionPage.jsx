// src/pages/SectionPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { DEFAULT_NAV } from '../utils/navConfig';
import { Plus, Trash2, Save } from 'lucide-react';

export default function SectionPage() {
  const { sectionId } = useParams();
  const { user } = useAuth();
  const [navItems, setNavItems] = useState(DEFAULT_NAV);
  const [newChildLabel, setNewChildLabel] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'navigation'), (snap) => {
      if (snap.exists()) setNavItems(snap.data().items || DEFAULT_NAV);
    });
    return unsub;
  }, []);

  const section = navItems.find(s => s.id === sectionId);
  if (!section) return <div>Section not found.</div>;

  const addChild = async () => {
    if (!newChildLabel.trim()) return;
    const id = `${sectionId}-${Date.now()}`;
    const updated = navItems.map(s => s.id === sectionId
      ? { ...s, children: [...(s.children || []), { id, label: newChildLabel.trim() }] }
      : s
    );
    await setDoc(doc(db, 'settings', 'navigation'), { items: updated });
    setNewChildLabel(''); setShowAdd(false);
  };

  const removeChild = async (childId) => {
    if (!confirm('Remove this item?')) return;
    const updated = navItems.map(s => s.id === sectionId
      ? { ...s, children: (s.children || []).filter(c => c.id !== childId) }
      : s
    );
    await setDoc(doc(db, 'settings', 'navigation'), { items: updated });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>{section.label}</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.9375rem' }}>
          Select a topic below to view documents and discussions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {(section.children || []).map(child => (
          <div key={child.id} style={{ position: 'relative' }}>
            <Link to={`/section/${sectionId}/${child.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                padding: '20px 16px', cursor: 'pointer',
                transition: 'box-shadow var(--transition), transform var(--transition)'
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
              >
                {child.restricted && <span style={{ fontSize: '0.7rem', marginBottom: 6, display: 'block' }}>🔒 Protected</span>}
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4 }}>{child.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>View documents →</div>
              </div>
            </Link>
            {user?.isAdmin && (
              <button className="btn-icon" style={{ position: 'absolute', top: 8, right: 8 }}
                onClick={() => removeChild(child.id)}>
                <Trash2 size={13} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            )}
          </div>
        ))}

        {user?.isAdmin && (
          showAdd ? (
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="input" placeholder="Item name" value={newChildLabel}
                onChange={e => setNewChildLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChild()}
                autoFocus />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={addChild}><Save size={12} /> Add</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="card" style={{
              padding: '20px 16px', cursor: 'pointer', border: '1.5px dashed var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-tertiary)', gap: 6, fontSize: '0.875rem'
            }}
              onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add item
            </div>
          )
        )}
      </div>
    </div>
  );
}
