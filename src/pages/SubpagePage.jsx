import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { DEFAULT_NAV } from '../utils/navConfig';
import { Upload, Trash2, Eye, MessageSquare, ThumbsUp, Plus, Send, FileText, Edit2, Check, X, CheckCircle, Image as ImageIcon, Highlighter } from 'lucide-react';

function FileIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase();
  const colors = { pdf: '#FF3B30', xlsx: '#34C759', xls: '#34C759', docx: '#0071e3', doc: '#0071e3', txt: '#8E8E93', md: '#5856D6', csv: '#34C759', png: '#AF52DE', jpg: '#AF52DE', jpeg: '#AF52DE' };
  return <span style={{ fontSize: '0.8rem', fontWeight: 700, color: colors[ext] || '#8E8E93' }}>{ext?.toUpperCase() || 'FILE'}</span>;
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function HighlightedText({ text, highlights, onMarkClick }) {
  let parts = [{ text }];
  (highlights || []).forEach(h => {
    if (!h.quote) return;
    const next = [];
    const re = new RegExp(escapeRegExp(h.quote), 'gi');
    parts.forEach(part => {
      if (part.h) { next.push(part); return; }
      let last = 0, m;
      while ((m = re.exec(part.text)) !== null) {
        if (m.index > last) next.push({ text: part.text.slice(last, m.index) });
        next.push({ text: m[0], h });
        last = m.index + m[0].length;
      }
      if (last < part.text.length) next.push({ text: part.text.slice(last) });
    });
    parts = next;
  });
  return parts.map((p, i) => p.h ? <mark key={i} className="saved-highlight" title={p.h.comment} onClick={() => onMarkClick?.(p.h)}>{p.text}</mark> : <span key={i}>{p.text}</span>);
}

function SimpleMarkdown({ content, highlights, onMarkClick }) {
  const lines = (content || '').split('\n');
  const blocks = [];
  let list = [];
  const flushList = () => { if (list.length) { blocks.push({ type: 'ul', items: list }); list = []; } };
  lines.forEach((line, i) => {
    if (!line.trim()) { flushList(); return; }
    const img = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (img) { flushList(); blocks.push({ type: 'img', alt: img[1], src: img[2] }); return; }
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) { flushList(); blocks.push({ type: `h${h[1].length}`, text: h[2] }); return; }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) { list.push(bullet[1]); return; }
    flushList(); blocks.push({ type: 'p', text: line });
  });
  flushList();
  const renderInline = (text) => {
    const link = text.match(/\[(.*?)\]\((.*?)\)/);
    if (!link) return <HighlightedText text={text} highlights={highlights} onMarkClick={onMarkClick} />;
    const before = text.slice(0, link.index), after = text.slice(link.index + link[0].length);
    return <><HighlightedText text={before} highlights={highlights} onMarkClick={onMarkClick} /><a href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a><HighlightedText text={after} highlights={highlights} onMarkClick={onMarkClick} /></>;
  };
  return <div className="markdown-body simple-md">{blocks.map((b, i) => {
    if (b.type === 'h1') return <h1 key={i}>{renderInline(b.text)}</h1>;
    if (b.type === 'h2') return <h2 key={i}>{renderInline(b.text)}</h2>;
    if (b.type === 'h3') return <h3 key={i}>{renderInline(b.text)}</h3>;
    if (b.type === 'ul') return <ul key={i}>{b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ul>;
    if (b.type === 'img') return <figure key={i}><img src={b.src} alt={b.alt} /><figcaption>{b.alt}</figcaption></figure>;
    return <p key={i}>{renderInline(b.text)}</p>;
  })}</div>;
}

function DiscussSection({ collectionPath, user }) {
  const [posts, setPosts] = useState([]), [newPost, setNewPost] = useState(''), [anonymous, setAnonymous] = useState(false), [replyTo, setReplyTo] = useState(null), [replyText, setReplyText] = useState('');
  useEffect(() => { const q = query(collection(db, collectionPath), orderBy('createdAt', 'asc')); return onSnapshot(q, snap => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }, [collectionPath]);
  const addPost = async () => { if (!newPost.trim()) return; await addDoc(collection(db, collectionPath), { content: newPost.trim(), author: anonymous ? 'Anonymous' : user.username, isAnonymous: anonymous, likes: [], replies: [], createdAt: serverTimestamp() }); setNewPost(''); };
  const toggleLike = async (post) => { const likes = post.likes || []; await updateDoc(doc(db, collectionPath, post.id), { likes: likes.includes(user.username) ? likes.filter(u => u !== user.username) : [...likes, user.username] }); };
  const addReply = async (postId) => { if (!replyText.trim()) return; const post = posts.find(p => p.id === postId); await updateDoc(doc(db, collectionPath, postId), { replies: [...(post.replies || []), { author: anonymous ? 'Anonymous' : user.username, content: replyText.trim(), createdAt: new Date().toISOString() }] }); setReplyText(''); setReplyTo(null); };
  const deletePost = async (postId) => { if (confirm('Delete this post?')) await deleteDoc(doc(db, collectionPath, postId)); };
  return <div><div className="comment-composer"><textarea className="input" rows={2} placeholder="Start a discussion…" value={newPost} onChange={e => setNewPost(e.target.value)} /><div className="flex items-center gap-2 mt-2"><label className="text-sm text-secondary"><input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} /> Post anonymously</label><button className="btn btn-primary btn-sm" onClick={addPost} style={{ marginLeft: 'auto' }}><Send size={12} /> Post</button></div></div>{posts.length === 0 && <Empty label="No discussions yet. Be the first." />}{posts.map(post => <div key={post.id} className="discussion-card"><div className="flex justify-between"><b className="text-sm">{post.author}</b><span className="text-xs text-secondary">{post.createdAt?.toDate?.()?.toLocaleDateString('en-CA')}</span></div><p style={{ whiteSpace: 'pre-wrap', margin: '8px 0' }}>{post.content}</p><div className="flex gap-3"><button className="link-button" onClick={() => toggleLike(post)}><ThumbsUp size={13} /> {(post.likes || []).length}</button><button className="link-button" onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}><MessageSquare size={13} /> Reply {(post.replies || []).length ? `(${post.replies.length})` : ''}</button>{(user.isAdmin || (!post.isAnonymous && post.author === user.username)) && <button className="link-button" onClick={() => deletePost(post.id)}><Trash2 size={13} /> Delete</button>}</div>{(post.replies || []).length > 0 && <div className="reply-stack">{post.replies.map((r, i) => <div key={i}><b>{r.author}</b>: {r.content}</div>)}</div>}{replyTo === post.id && <div className="flex gap-2 mt-2"><input className="input" placeholder="Write a reply…" value={replyText} onChange={e => setReplyText(e.target.value)} /><button className="btn btn-primary btn-sm" onClick={() => addReply(post.id)}>Reply</button></div>}</div>)}</div>;
}

function Empty({ label }) { return <div style={{ textAlign: 'center', padding: '42px 0', color: 'var(--text-tertiary)' }}><FileText size={38} style={{ opacity: .28, marginBottom: 10 }} /><div>{label}</div></div>; }

function AnnotationPanel({ fileId, user }) {
  const [annotations, setAnnotations] = useState([]), [newNote, setNewNote] = useState('');
  useEffect(() => { const q = query(collection(db, `annotations/${fileId}/notes`), orderBy('createdAt', 'asc')); return onSnapshot(q, snap => setAnnotations(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }, [fileId]);
  const add = async () => { if (!newNote.trim()) return; await addDoc(collection(db, `annotations/${fileId}/notes`), { content: newNote.trim(), author: user.username, createdAt: serverTimestamp() }); setNewNote(''); };
  const remove = async (id) => await deleteDoc(doc(db, `annotations/${fileId}/notes`, id));
  return <div className="mt-2"><div className="flex gap-2 mb-2"><input className="input" placeholder="Add annotation…" value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} /><button className="btn btn-primary btn-sm" onClick={add}><Plus size={12} /></button></div>{annotations.map(a => <div key={a.id} className="note-row"><div><b>{a.author}</b> {a.content}</div>{(user.isAdmin || a.author === user.username) && <button className="btn-icon" onClick={() => remove(a.id)}><X size={11} /></button>}</div>)}</div>;
}

export default function SubpagePage() {
  const { sectionId, subId } = useParams();
  const { user } = useAuth();
  const [navItems, setNavItems] = useState(DEFAULT_NAV), [files, setFiles] = useState([]), [markdowns, setMarkdowns] = useState([]), [uploading, setUploading] = useState(false), [tab, setTab] = useState('files'), [expandedAnnotations, setExpandedAnnotations] = useState({});
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false), [mdTitle, setMdTitle] = useState(''), [mdContent, setMdContent] = useState(''), [viewingMd, setViewingMd] = useState(null), [editingMd, setEditingMd] = useState(null), [proposals, setProposals] = useState([]), [proposalText, setProposalText] = useState(''), [showProposalForm, setShowProposalForm] = useState(false);
  const [mdHighlights, setMdHighlights] = useState([]), [selectionQuote, setSelectionQuote] = useState(''), [highlightComment, setHighlightComment] = useState('');
  const imageInputRef = useRef(null);
  const collectionBase = `pages/${sectionId}_${subId}`;

  useEffect(() => onSnapshot(doc(db, 'settings', 'navigation'), snap => setNavItems(snap.exists() ? snap.data().items || DEFAULT_NAV : DEFAULT_NAV)), []);
  useEffect(() => { const u1 = onSnapshot(query(collection(db, `${collectionBase}/files`), orderBy('createdAt', 'desc')), snap => setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })))); const u2 = onSnapshot(query(collection(db, `${collectionBase}/markdowns`), orderBy('createdAt', 'desc')), snap => setMarkdowns(snap.docs.map(d => ({ id: d.id, ...d.data() })))); const u3 = onSnapshot(query(collection(db, `${collectionBase}/proposals`), orderBy('createdAt', 'desc')), snap => setProposals(snap.docs.map(d => ({ id: d.id, ...d.data() })))); return () => { u1(); u2(); u3(); }; }, [collectionBase]);
  useEffect(() => { if (!viewingMd) return; const q = query(collection(db, `markdownHighlights/${viewingMd.id}/items`), orderBy('createdAt', 'asc')); return onSnapshot(q, snap => setMdHighlights(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }, [viewingMd]);

  const uploadFiles = async (e) => { const selected = [...(e.target.files || [])]; if (!selected.length) return; setUploading(true); try { for (const file of selected) { const storageRef = ref(storage, `uploads/${sectionId}/${subId}/${Date.now()}_${file.name}`); await uploadBytes(storageRef, file); const url = await getDownloadURL(storageRef); await addDoc(collection(db, `${collectionBase}/files`), { name: file.name, url, storagePath: storageRef.fullPath, uploadedBy: user.username, createdAt: serverTimestamp() }); } } finally { setUploading(false); e.target.value = ''; } };
  const uploadMarkdownImage = async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { const storageRef = ref(storage, `markdown-images/${sectionId}/${subId}/${Date.now()}_${file.name}`); await uploadBytes(storageRef, file); const url = await getDownloadURL(storageRef); setMdContent(prev => `${prev}\n\n![${file.name}](${url})\n`); } finally { setUploading(false); e.target.value = ''; } };
  const deleteFile = async (file) => { if (!confirm(`Delete "${file.name}"?`)) return; if (file.storagePath) { try { await deleteObject(ref(storage, file.storagePath)); } catch {} } await deleteDoc(doc(db, `${collectionBase}/files`, file.id)); };
  const saveMarkdown = async () => { if (!mdTitle.trim() || !mdContent.trim()) return; if (editingMd) { await updateDoc(doc(db, `${collectionBase}/markdowns`, editingMd), { title: mdTitle.trim(), content: mdContent, updatedAt: serverTimestamp(), updatedBy: user.username }); setEditingMd(null); } else { await addDoc(collection(db, `${collectionBase}/markdowns`), { title: mdTitle.trim(), content: mdContent, createdBy: user.username, createdAt: serverTimestamp() }); } setMdTitle(''); setMdContent(''); setShowMarkdownEditor(false); };
  const deleteMd = async (id) => { if (confirm('Delete this page?')) await deleteDoc(doc(db, `${collectionBase}/markdowns`, id)); };
  const submitProposal = async () => { if (!proposalText.trim()) return; await addDoc(collection(db, `${collectionBase}/proposals`), { content: proposalText.trim(), author: user.username, status: 'pending', createdAt: serverTimestamp() }); setProposalText(''); setShowProposalForm(false); };
  const resolveProposal = async (id, approved) => updateDoc(doc(db, `${collectionBase}/proposals`, id), { status: approved ? 'approved' : 'rejected', resolvedBy: user.username, resolvedAt: serverTimestamp() });
  const captureSelection = () => { const text = window.getSelection()?.toString()?.trim(); if (text && viewingMd?.content?.toLowerCase().includes(text.toLowerCase())) setSelectionQuote(text); };
  const saveHighlight = async () => { if (!selectionQuote || !highlightComment.trim()) return; await addDoc(collection(db, `markdownHighlights/${viewingMd.id}/items`), { quote: selectionQuote, comment: highlightComment.trim(), author: user.username, createdAt: serverTimestamp() }); setSelectionQuote(''); setHighlightComment(''); window.getSelection()?.removeAllRanges(); };
  const deleteHighlight = async (id) => deleteDoc(doc(db, `markdownHighlights/${viewingMd.id}/items`, id));

  const section = navItems.find(s => s.id === sectionId); const sub = section?.children?.find(c => c.id === subId);

  if (viewingMd) return <div><button className="btn btn-ghost btn-sm mb-4" onClick={() => setViewingMd(null)}>← Back</button><div className="reader-layout"><article className="card card-padded reader-card"><div className="flex justify-between items-center mb-4"><h1 style={{ fontSize: '1.6rem' }}>{viewingMd.title}</h1>{user.isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => { setMdTitle(viewingMd.title); setMdContent(viewingMd.content); setEditingMd(viewingMd.id); setShowMarkdownEditor(true); setViewingMd(null); }}><Edit2 size={12} /> Edit</button>}</div><div onMouseUp={captureSelection}><SimpleMarkdown content={viewingMd.content} highlights={mdHighlights} onMarkClick={(h) => alert(`${h.quote}\n\n${h.comment}\n— ${h.author}`)} /></div></article><aside className="card card-padded annotation-sidebar"><h3 className="mb-2"><Highlighter size={16} /> Highlights & comments</h3><p className="text-sm text-secondary mb-3">Select text in the rendered page, then add a comment. Saved highlights are shared and persistent.</p>{selectionQuote && <div className="selected-quote mb-2">“{selectionQuote}”</div>}<textarea className="input" rows={3} placeholder="Comment on selected text…" value={highlightComment} onChange={e => setHighlightComment(e.target.value)} /><button className="btn btn-primary btn-sm mt-2" onClick={saveHighlight} disabled={!selectionQuote}>Save highlight</button><hr className="divider" />{mdHighlights.map(h => <div key={h.id} className="highlight-note"><div className="quote">“{h.quote}”</div><div>{h.comment}</div><div className="flex justify-between text-xs text-secondary mt-1"><span>{h.author}</span>{(user.isAdmin || h.author === user.username) && <button className="link-button" onClick={() => deleteHighlight(h.id)}>Delete</button>}</div></div>)}</aside></div></div>;

  return <div><div style={{ marginBottom: 20 }}><div className="text-sm text-secondary mb-1">{section?.label} / {sub?.label || subId}</div><h1>{sub?.label || subId}</h1></div><div className="tabbar">{['files', 'discuss', 'proposals'].map(t => <button key={t} onClick={() => setTab(t)} className={tab === t ? 'active' : ''}>{t === 'files' ? 'Documents' : t === 'discuss' ? 'Discussion' : 'Proposals'}</button>)}</div>{tab === 'files' && <div>{user.isAdmin && <div className="upload-zone"><label className="btn btn-primary btn-sm"><Upload size={13} /> {uploading ? 'Uploading…' : 'Upload Files'}<input type="file" multiple hidden onChange={uploadFiles} disabled={uploading} accept=".pdf,.xlsx,.xls,.docx,.doc,.txt,.md,.csv,.png,.jpg,.jpeg" /></label><button className="btn btn-secondary btn-sm" onClick={() => { setShowMarkdownEditor(p => !p); setEditingMd(null); setMdTitle(''); setMdContent(''); }}><Plus size={13} /> New Markdown Page</button></div>}{showMarkdownEditor && <div className="card card-padded mb-4"><h3 className="mb-3">{editingMd ? 'Edit Markdown Page' : 'New Markdown Page'}</h3><input className="input mb-2" placeholder="Page title" value={mdTitle} onChange={e => setMdTitle(e.target.value)} /><textarea className="input" rows={12} placeholder={'Write markdown here…\n\nImages: click Insert image or use ![caption](image-url)'} value={mdContent} onChange={e => setMdContent(e.target.value)} style={{ fontFamily: 'SF Mono, Menlo, monospace', fontSize: '.875rem' }} /><input ref={imageInputRef} type="file" hidden accept="image/*" onChange={uploadMarkdownImage} /><div className="flex gap-2 mt-2"><button className="btn btn-secondary btn-sm" onClick={() => imageInputRef.current?.click()}><ImageIcon size={13} /> Insert image</button><button className="btn btn-primary btn-sm" onClick={saveMarkdown}><Check size={12} /> Save</button><button className="btn btn-secondary btn-sm" onClick={() => { setShowMarkdownEditor(false); setEditingMd(null); }}>Cancel</button></div></div>}{markdowns.length > 0 && <SectionList title="Markdown pages">{markdowns.map(md => <div key={md.id} className="list-card" onClick={() => setViewingMd(md)}><div className="flex items-center gap-2"><FileIcon name="page.md" /><b>{md.title}</b></div><div className="flex items-center gap-2"><span className="text-xs text-secondary">by {md.createdBy}</span>{user.isAdmin && <button className="btn-icon" onClick={e => { e.stopPropagation(); deleteMd(md.id); }}><Trash2 size={13} /></button>}</div></div>)}</SectionList>}{files.length > 0 && <SectionList title="Files">{files.map(file => <div key={file.id}><div className="list-card"><div className="flex items-center gap-2"><FileIcon name={file.name} /><div><a href={file.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</a><div className="text-xs text-secondary">Uploaded by {file.uploadedBy}</div></div></div><div className="flex gap-2"><a href={file.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Eye size={12} /> View</a><button className="btn-icon" onClick={() => setExpandedAnnotations(p => ({ ...p, [file.id]: !p[file.id] }))}><MessageSquare size={14} /></button>{user.isAdmin && <button className="btn-icon" onClick={() => deleteFile(file)}><Trash2 size={13} /></button>}</div></div>{expandedAnnotations[file.id] && <div className="annotation-inline"><AnnotationPanel fileId={file.id} user={user} /></div>}</div>)}</SectionList>}{files.length === 0 && markdowns.length === 0 && <Empty label={user.isAdmin ? 'No documents yet. Upload a file or create a Markdown page.' : 'No documents yet.'} />}</div>}{tab === 'discuss' && <DiscussSection collectionPath={`${collectionBase}/discussions`} user={user} />}{tab === 'proposals' && <div><p className="text-sm text-secondary mb-3">Submit proposed changes for this page. Admin can approve or reject each proposal.</p>{!showProposalForm && <button className="btn btn-primary btn-sm mb-3" onClick={() => setShowProposalForm(true)}><Plus size={13} /> Submit Proposal</button>}{showProposalForm && <div className="card card-padded mb-4"><textarea className="input" rows={5} placeholder="Describe the proposed change…" value={proposalText} onChange={e => setProposalText(e.target.value)} /><div className="flex gap-2 mt-2"><button className="btn btn-primary btn-sm" onClick={submitProposal}><Send size={12} /> Submit</button><button className="btn btn-secondary btn-sm" onClick={() => setShowProposalForm(false)}>Cancel</button></div></div>}{proposals.length === 0 ? <Empty label="No proposals yet." /> : proposals.map(p => <div key={p.id} className="card card-padded mb-2"><div className="flex justify-between mb-2"><div className="flex gap-2 items-center"><b>{p.author}</b><span className={`badge badge-${p.status === 'approved' ? 'green' : p.status === 'rejected' ? 'red' : 'gray'}`}>{p.status}</span></div><span className="text-xs text-secondary">{p.createdAt?.toDate?.()?.toLocaleDateString?.()}</span></div><p style={{ whiteSpace: 'pre-wrap' }}>{p.content}</p>{user.isAdmin && p.status === 'pending' && <div className="flex gap-2 mt-2"><button className="btn btn-sm" style={{ background: '#e3f9e5', color: '#1a7f37' }} onClick={() => resolveProposal(p.id, true)}><CheckCircle size={13} /> Approve</button><button className="btn btn-sm" style={{ background: '#ffeef0', color: 'var(--danger)' }} onClick={() => resolveProposal(p.id, false)}><X size={13} /> Reject</button></div>}</div>)}</div>}</div>;
}

function SectionList({ title, children }) { return <div className="mb-4"><h3 className="section-kicker">{title}</h3>{children}</div>; }
