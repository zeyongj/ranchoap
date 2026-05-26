// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection, doc, onSnapshot, setDoc, addDoc, deleteDoc,
  query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { Megaphone, Plus, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

function VancouverClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const opts = { timeZone: 'America/Vancouver' };
      setTime(new Date().toLocaleTimeString('en-CA', { ...opts, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDate(new Date().toLocaleDateString('en-CA', { ...opts, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return (
    <div className="card card-padded" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
        Vancouver, BC
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 300, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 6 }}>
        {time}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{date}</div>
    </div>
  );
}

function MiniCalendar({ schedules, onDayClick, selectedDate }) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = viewDate.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prev = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const next = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) => d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  const isSelected = (d) => {
    if (!d || !selectedDate) return false;
    return selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === d;
  };
  const hasSchedule = (d) => {
    if (!d) return false;
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return schedules[key] && schedules[key].trim();
  };

  return (
    <div className="card card-padded">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button className="btn-icon" onClick={prev}><ChevronLeft size={16} /></button>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{monthName}</span>
        <button className="btn-icon" onClick={next}><ChevronRight size={16} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {days.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', padding: '4px 0', textTransform: 'uppercase' }}>{d}</div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            onClick={() => d && onDayClick(new Date(year, month, d))}
            style={{
              textAlign: 'center', padding: '6px 2px', borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem', cursor: d ? 'pointer' : 'default',
              background: isSelected(d) ? 'var(--accent)' : isToday(d) ? 'var(--surface-3)' : 'transparent',
              color: isSelected(d) ? '#fff' : isToday(d) ? 'var(--accent)' : d ? 'var(--text-primary)' : 'transparent',
              fontWeight: isToday(d) || isSelected(d) ? 700 : 400,
              position: 'relative',
              transition: 'background var(--transition)'
            }}
            onMouseEnter={e => { if (d && !isSelected(d)) e.currentTarget.style.background = 'var(--surface-3)'; }}
            onMouseLeave={e => { if (d && !isSelected(d)) e.currentTarget.style.background = isToday(d) ? 'var(--surface-3)' : 'transparent'; }}
          >
            {d || ''}
            {hasSchedule(d) && (
              <div style={{
                width: 4, height: 4, borderRadius: '50%',
                background: isSelected(d) ? 'rgba(255,255,255,.8)' : 'var(--accent)',
                position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)'
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleText, setScheduleText] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  const dateKey = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : '';

  // Load schedules from one document per date so they persist reliably after login/refresh
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'schedules'), (snap) => {
      const next = {};
      snap.docs.forEach(d => { next[d.id] = d.data().content || ''; });
      setSchedules(next);
    });
    return unsub;
  }, []);

  // Load announcements
  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const keyForDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const handleDayClick = (date) => {
    const nextKey = keyForDate(date);
    setSelectedDate(date);
    setEditingSchedule(false);
    setScheduleText(schedules[nextKey] || '');
  };

  const saveSchedule = async () => {
    await setDoc(doc(db, 'schedules', dateKey), {
      content: scheduleText,
      date: dateKey,
      updatedBy: user.username,
      updatedAt: serverTimestamp()
    }, { merge: true });
    setEditingSchedule(false);
  };

  const addAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    await addDoc(collection(db, 'announcements'), {
      content: newAnnouncement.trim(),
      author: user.username,
      createdAt: serverTimestamp()
    });
    setNewAnnouncement('');
    setShowAnnouncementForm(false);
  };

  const deleteAnnouncement = async (id) => {
    await deleteDoc(doc(db, 'announcements', id));
  };

  const selectedSchedule = schedules[dateKey] || '';
  const selectedDateLabel = selectedDate?.toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: 4 }}>Good {getGreeting()}, {user?.username} 👋</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Here's what's happening today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        <VancouverClock />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Calendar */}
        <MiniCalendar schedules={schedules} onDayClick={handleDayClick} selectedDate={selectedDate} />

        {/* Schedule for selected day */}
        <div className="card card-padded">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.9375rem' }}>{selectedDateLabel}</h3>
            {user?.isAdmin && !editingSchedule && (
              <button className="btn-icon" onClick={() => { setEditingSchedule(true); setScheduleText(selectedSchedule); }}>
                <Edit2 size={14} />
              </button>
            )}
          </div>
          {editingSchedule ? (
            <div>
              <textarea
                className="input"
                rows={5}
                value={scheduleText}
                onChange={e => setScheduleText(e.target.value)}
                placeholder="Add schedule for this day…"
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={saveSchedule}><Check size={13} /> Save</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingSchedule(false)}><X size={13} /> Cancel</button>
              </div>
            </div>
          ) : selectedSchedule ? (
            <div style={{
              fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap', background: 'var(--surface-2)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px'
            }}>
              {selectedSchedule}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '24px 0',
              color: 'var(--text-tertiary)', fontSize: '0.875rem'
            }}>
              No schedule for this day
              {user?.isAdmin && (
                <div><button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
                  onClick={() => { setEditingSchedule(true); setScheduleText(''); }}>
                  <Plus size={13} /> Add schedule
                </button></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="card card-padded">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={16} style={{ color: 'var(--accent)' }} /> Announcements
          </h3>
          {user?.isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAnnouncementForm(p => !p)}>
              <Plus size={13} /> Post
            </button>
          )}
        </div>

        {showAnnouncementForm && (
          <div style={{
            background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
            padding: 14, marginBottom: 14, border: '1px solid var(--border-light)'
          }}>
            <textarea
              className="input"
              rows={3}
              placeholder="Write an announcement…"
              value={newAnnouncement}
              onChange={e => setNewAnnouncement(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={addAnnouncement}>Post</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAnnouncementForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            No announcements yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {announcements.map(a => (
              <div key={a.id} style={{
                display: 'flex', gap: 12, padding: '12px 14px',
                background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--accent)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#fff', fontSize: '0.8125rem',
                  fontWeight: 700, flexShrink: 0
                }}>
                  {a.author?.[0]?.toUpperCase() || 'A'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                    {a.author}
                    <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 8 }}>
                      {a.createdAt?.toDate?.()?.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{a.content}</div>
                </div>
                {user?.isAdmin && (
                  <button className="btn-icon" onClick={() => deleteAnnouncement(a.id)} style={{ alignSelf: 'flex-start' }}>
                    <Trash2 size={14} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
