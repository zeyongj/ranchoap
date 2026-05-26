import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { DEFAULT_NAV } from '../utils/navConfig';
import LockModal from './LockModal';
import {
  ChevronDown, ChevronRight, LogOut, MessageSquare, Home, Plus,
  Menu, Shield, Trash2, Edit3, Save, X, Settings
} from 'lucide-react';

const slug = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `item-${Date.now()}`;

function NavManager({ items, onSave, onClose }) {
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(items)));
  const [sectionLabel, setSectionLabel] = useState('');

  const save = async () => {
    await onSave(draft);
    onClose();
  };
  const addSection = () => {
    if (!sectionLabel.trim()) return;
    setDraft(prev => [...prev, { id: slug(sectionLabel), label: sectionLabel.trim(), restricted: false, children: [] }]);
    setSectionLabel('');
  };
  const updateSection = (idx, patch) => setDraft(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  const removeSection = (idx) => setDraft(prev => prev.filter((_, i) => i !== idx));
  const addChild = (idx) => {
    const label = prompt('Sub-item name / 子项目名称');
    if (!label?.trim()) return;
    setDraft(prev => prev.map((s, i) => i === idx ? {
      ...s,
      children: [...(s.children || []), { id: `${s.id}-${slug(label)}`, label: label.trim() }]
    } : s));
  };
  const updateChild = (sIdx, cIdx, patch) => setDraft(prev => prev.map((s, i) => i === sIdx ? {
    ...s,
    children: (s.children || []).map((c, j) => j === cIdx ? { ...c, ...patch } : c)
  } : s));
  const removeChild = (sIdx, cIdx) => setDraft(prev => prev.map((s, i) => i === sIdx ? {
    ...s,
    children: (s.children || []).filter((_, j) => j !== cIdx)
  } : s));

  return (
    <div className="overlay">
      <div className="modal" style={{ maxWidth: 760, maxHeight: '88vh', overflow: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2>Navigation Manager</h2>
            <p className="text-sm text-secondary">Admin can add, rename, delete, and lock menu items.</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex gap-2 mb-4">
          <input className="input" value={sectionLabel} onChange={e => setSectionLabel(e.target.value)} placeholder="New main menu item" />
          <button className="btn btn-secondary" onClick={addSection}><Plus size={15} /> Add</button>
        </div>
        {draft.map((section, sIdx) => (
          <div key={section.id} className="card card-padded" style={{ marginBottom: 12 }}>
            <div className="flex gap-2 items-center mb-2">
              <input className="input" value={section.label} onChange={e => updateSection(sIdx, { label: e.target.value })} />
              <select className="input" style={{ maxWidth: 170 }} value={section.restricted || 'false'} onChange={e => updateSection(sIdx, { restricted: e.target.value === 'false' ? false : e.target.value })}>
                <option value="false">Open</option>
                <option value="senior">Senior AP lock</option>
              </select>
              <button className="btn-icon" onClick={() => addChild(sIdx)} title="Add sub-item"><Plus size={16} /></button>
              {section.id !== 'discussions' && section.id !== 'discuss' && <button className="btn-icon" onClick={() => removeSection(sIdx)}><Trash2 size={16} /></button>}
            </div>
            {(section.children || []).map((child, cIdx) => (
              <div key={child.id} className="flex gap-2 items-center" style={{ marginLeft: 18, marginTop: 8 }}>
                <input className="input" value={child.label} onChange={e => updateChild(sIdx, cIdx, { label: e.target.value })} />
                <select className="input" style={{ maxWidth: 190 }} value={child.restricted || 'false'} onChange={e => updateChild(sIdx, cIdx, { restricted: e.target.value === 'false' ? false : e.target.value })}>
                  <option value="false">Open</option>
                  <option value="postpayment">Post Payment lock</option>
                </select>
                <button className="btn-icon" onClick={() => removeChild(sIdx, cIdx)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        ))}
        <div className="flex gap-2 justify-between">
          <button className="btn btn-secondary" onClick={() => setDraft(DEFAULT_NAV)}>Restore default</button>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save}><Save size={15} /> Save navigation</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout, seniorUnlocked, postPaymentUnlocked, unlockSenior, unlockPostPayment } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navItems, setNavItems] = useState(DEFAULT_NAV);
  const [openSections, setOpenSections] = useState({ scanner: true, ap: true, seniorap: true });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lockModal, setLockModal] = useState(null);
  const [navManagerOpen, setNavManagerOpen] = useState(false);
  const [vancouver, setVancouver] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'navigation'), async (snap) => {
      if (snap.exists()) setNavItems(snap.data().items || DEFAULT_NAV);
      else await setDoc(doc(db, 'settings', 'navigation'), { items: DEFAULT_NAV }, { merge: true });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const tick = () => setVancouver(new Date().toLocaleTimeString('en-CA', { timeZone: 'America/Vancouver', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const signOut = () => { logout(); navigate('/logout', { replace: true }); };
  const toggleSection = (id) => setOpenSections(p => ({ ...p, [id]: !p[id] }));
  const handleSubClick = (section, sub, e) => {
    const path = `/section/${section.id}/${sub.id}`;
    if (section.restricted === 'senior' && !seniorUnlocked && !user?.isAdmin) { e.preventDefault(); setLockModal({ type: 'senior', targetPath: path }); return; }
    if (sub.restricted === 'postpayment' && !postPaymentUnlocked && !user?.isAdmin) { e.preventDefault(); setLockModal({ type: 'postpayment', targetPath: path }); }
  };
  const handleLockSubmit = (password) => {
    if (lockModal.type === 'senior' && unlockSenior(password)) { navigate(lockModal.targetPath); setLockModal(null); return true; }
    if (lockModal.type === 'postpayment' && unlockPostPayment(password)) { navigate(lockModal.targetPath); setLockModal(null); return true; }
    return false;
  };
  const saveNav = async (items) => setDoc(doc(db, 'settings', 'navigation'), { items, updatedAt: new Date().toISOString(), updatedBy: user.username }, { merge: true });
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <aside className="sidebar" style={{ width: sidebarOpen ? 'var(--sidebar-width)' : 0, minWidth: sidebarOpen ? 'var(--sidebar-width)' : 0 }}>
        <div className="sidebar-brand">
          <div className="brand-mark">R</div>
          <div><div style={{ fontWeight: 700 }}>RanchoAP</div><div className="text-xs text-secondary">Vancouver · {vancouver}</div></div>
        </div>
        <div className="user-pill" style={{ background: user?.isAdmin ? 'linear-gradient(135deg,#1d1d1f,#3a3a3c)' : 'var(--surface-2)', color: user?.isAdmin ? '#fff' : 'var(--text-primary)' }}>
          <div className="avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          <div className="truncate"><div className="font-semibold truncate">{user?.username}</div>{user?.isAdmin && <div className="text-xs" style={{ opacity: .72 }}><Shield size={10} /> Admin</div>}</div>
        </div>
        {user?.isAdmin && <button className="btn btn-secondary btn-sm" style={{ margin: '8px 12px', justifyContent: 'center' }} onClick={() => setNavManagerOpen(true)}><Settings size={14} /> Edit menu</button>}
        <nav className="side-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-row ${isActive ? 'active' : ''}`}><Home size={15} /> Home</NavLink>
          {navItems.map(section => {
            const isDiscussion = section.id === 'discuss' || section.id === 'discussions';
            if (isDiscussion) return <NavLink to="/discussions" key={section.id} className={({ isActive }) => `nav-row ${isActive ? 'active' : ''}`}><MessageSquare size={15} /> Discussion Board</NavLink>;
            const hasChildren = (section.children || []).length > 0;
            const open = openSections[section.id];
            const active = isActive(`/section/${section.id}`);
            return (
              <div key={section.id}>
                <div className={`nav-row ${active && !hasChildren ? 'active' : ''}`} onClick={() => hasChildren ? toggleSection(section.id) : navigate(`/section/${section.id}`)}>
                  <span className="flex items-center gap-2">{section.restricted && '🔒'} {section.label}</span>{hasChildren && (open ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
                </div>
                {hasChildren && open && <div className="nav-children">
                  {section.children.map(sub => (
                    <NavLink key={sub.id} to={`/section/${section.id}/${sub.id}`} onClick={(e) => handleSubClick(section, sub, e)} className={({ isActive }) => `nav-child ${isActive ? 'active' : ''}`}>{sub.restricted && '🔒'} {sub.label}</NavLink>
                  ))}
                </div>}
              </div>
            );
          })}
        </nav>
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-light)' }}>
          <button className="btn btn-ghost btn-sm" onClick={signOut} style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}><LogOut size={14} /> Sign Out</button>
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="topbar"><button className="btn-icon" onClick={() => setSidebarOpen(p => !p)}><Menu size={18} /></button><div style={{ flex: 1 }} /><div className="text-sm text-secondary">{new Date().toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</div></header>
        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}><Outlet /><footer className="app-footer">© {new Date().getFullYear()} Zeyong Jin · All rights reserved.</footer></main>
      </div>
      {lockModal && <LockModal title={lockModal.type === 'senior' ? 'Senior AP Access' : 'Post Payment Access'} description={lockModal.type === 'senior' ? 'This section requires a special access code.' : 'Post Payment requires an additional access code.'} onSubmit={handleLockSubmit} onClose={() => setLockModal(null)} />}
      {navManagerOpen && <NavManager items={navItems} onSave={saveNav} onClose={() => setNavManagerOpen(false)} />}
    </div>
  );
}
