// src/pages/DiscussBoard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot, deleteDoc, doc,
  query, orderBy, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { Plus, ThumbsUp, MessageSquare, Trash2, Send, ChevronDown, ChevronUp, Tag } from 'lucide-react';

const TAGS = ['General', 'Question', 'Announcement', 'Tip', 'Issue', 'Other'];

export default function DiscussBoard() {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('General');
  const [anonymous, setAnonymous] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [filterTag, setFilterTag] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'discuss_board'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  const post = async () => {
    if (!title.trim() || !body.trim()) return;
    await addDoc(collection(db, 'discuss_board'), {
      title: title.trim(), body: body.trim(), tag,
      author: anonymous ? 'Anonymous' : user.username,
      isAnonymous: anonymous, likes: [], replies: [],
      createdAt: serverTimestamp()
    });
    setTitle(''); setBody(''); setTag('General'); setAnonymous(false); setShowForm(false);
  };

  const toggleLike = async (topic) => {
    const likes = topic.likes || [];
    const newLikes = likes.includes(user.username)
      ? likes.filter(u => u !== user.username)
      : [...likes, user.username];
    await updateDoc(doc(db, 'discuss_board', topic.id), { likes: newLikes });
  };

  const addReply = async (topicId) => {
    const text = replyTexts[topicId];
    if (!text?.trim()) return;
    const topic = topics.find(t => t.id === topicId);
    const replies = topic.replies || [];
    await updateDoc(doc(db, 'discuss_board', topicId), {
      replies: [...replies, {
        author: anonymous ? 'Anonymous' : user.username,
        content: text.trim(),
        createdAt: new Date().toISOString(),
        likes: []
      }]
    });
    setReplyTexts(p => ({ ...p, [topicId]: '' }));
  };

  const deleteTopic = async (id) => {
    if (!confirm('Delete this topic?')) return;
    await deleteDoc(doc(db, 'discuss_board', id));
  };

  const tagColors = {
    General: 'badge-gray', Question: 'badge-blue', Announcement: 'badge-orange',
    Tip: 'badge-green', Issue: 'badge-red', Other: 'badge-gray'
  };

  const filtered = filterTag === 'All' ? topics : topics.filter(t => t.tag === filterTag);

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Discussion Board</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            A shared space for questions, tips, and team discussions.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(p => !p)}>
          <Plus size={15} /> New Topic
        </button>
      </div>

      {/* New topic form */}
      {showForm && (
        <div className="card card-padded" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 14 }}>New Topic</h3>
          <input className="input" placeholder="Title" value={title}
            onChange={e => setTitle(e.target.value)} style={{ marginBottom: 10 }} />
          <textarea className="input" rows={4} placeholder="Describe your topic…"
            value={body} onChange={e => setBody(e.target.value)} style={{ marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TAGS.map(t => (
                <button key={t} onClick={() => setTag(t)} style={{
                  padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)',
                  background: tag === t ? 'var(--accent)' : 'var(--surface)',
                  color: tag === t ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.8rem', cursor: 'pointer', transition: 'all var(--transition)'
                }}>{t}</button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}>
              <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} />
              Post anonymously
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={post}><Send size={12} /> Post</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter tags */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['All', ...TAGS].map(t => (
          <button key={t} onClick={() => setFilterTag(t)} style={{
            padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)',
            background: filterTag === t ? 'var(--text-primary)' : 'var(--surface)',
            color: filterTag === t ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.8rem', cursor: 'pointer', transition: 'all var(--transition)'
          }}>{t}</button>
        ))}
      </div>

      {/* Topics list */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)', fontSize: '0.9375rem' }}>
          <MessageSquare size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: .3 }} />
          No topics yet. Start the conversation!
        </div>
      )}

      {filtered.map(topic => (
        <div key={topic.id} className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
          {/* Topic header */}
          <div style={{ padding: '14px 16px', cursor: 'pointer' }}
            onClick={() => setExpanded(p => ({ ...p, [topic.id]: !p[topic.id] }))}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className={`badge ${tagColors[topic.tag] || 'badge-gray'}`}>{topic.tag}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{topic.title}</h3>
                </div>
                <p style={{
                  fontSize: '0.875rem', color: 'var(--text-secondary)',
                  lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  display: '-webkit-box', WebkitLineClamp: expanded[topic.id] ? 'unset' : 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {topic.body}
                </p>
              </div>
              <div style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}>
                {expanded[topic.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{topic.author}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {topic.createdAt?.toDate?.()?.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button onClick={e => { e.stopPropagation(); toggleLike(topic); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '0.8rem',
                  color: (topic.likes || []).includes(user.username) ? 'var(--accent)' : 'var(--text-tertiary)',
                  padding: '2px 6px', borderRadius: 20, transition: 'all var(--transition)'
                }}>
                <ThumbsUp size={13} /> {(topic.likes || []).length}
              </button>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                <MessageSquare size={13} /> {(topic.replies || []).length}
              </span>
              {(user.isAdmin || (!topic.isAnonymous && topic.author === user.username)) && (
                <button onClick={e => { e.stopPropagation(); deleteTopic(topic.id); }}
                  className="btn-icon" style={{ marginLeft: 'auto' }}>
                  <Trash2 size={13} style={{ color: 'var(--text-tertiary)' }} />
                </button>
              )}
            </div>
          </div>

          {/* Expanded replies */}
          {expanded[topic.id] && (
            <div style={{ borderTop: '1px solid var(--border-light)', background: 'var(--surface-2)', padding: '14px 16px' }}>
              {/* Replies */}
              {(topic.replies || []).map((r, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, marginBottom: 12,
                  paddingBottom: 12, borderBottom: '1px solid var(--border-light)'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--surface-3)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                  }}>
                    {r.author?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 3 }}>
                      {r.author}
                      <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 6, fontSize: '0.75rem' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.content}</p>
                  </div>
                </div>
              ))}

              {/* Reply form */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="Write a reply…"
                  value={replyTexts[topic.id] || ''}
                  onChange={e => setReplyTexts(p => ({ ...p, [topic.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addReply(topic.id)}
                  style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" onClick={() => addReply(topic.id)}>Reply</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
