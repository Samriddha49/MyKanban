import { useEffect, useState, FormEvent } from 'react';
import { cardApi, commentApi, labelApi, attachmentApi } from '../api/endpoints';
import type { CardItem, Comment, Label, Attachment } from '../types';

interface Props {
  cardId: number;
  boardId: number;
  onClose: () => void;
  onChanged: () => void; // tell the board to refresh
}

export default function CardModal({ cardId, boardId, onClose, onChanged }: Props) {
  const [card, setCard] = useState<CardItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [cardRes, commentsRes, labelsRes, attachmentsRes] = await Promise.all([
        cardApi.get(cardId),
        commentApi.listByCard(cardId),
        labelApi.listByBoard(boardId),
        attachmentApi.listByCard(cardId),
      ]);
      setCard(cardRes.data);
      setTitle(cardRes.data.title);
      setDescription(cardRes.data.description || '');
      setDueDate(cardRes.data.dueDate || '');
      setComments(commentsRes.data);
      setBoardLabels(labelsRes.data);
      setAttachments(attachmentsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load card.');
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  const handleSave = async () => {
    try {
      await cardApi.update(cardId, title, description, dueDate || undefined);
      onChanged();
      loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save card.');
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await commentApi.add(cardId, newComment.trim());
    setNewComment('');
    loadAll();
  };

  const toggleLabel = async (labelId: number) => {
    if (!card) return;
    const hasLabel = card.labels.some((l) => l.id === labelId);
    if (hasLabel) {
      await cardApi.removeLabel(cardId, labelId);
    } else {
      await cardApi.addLabel(cardId, labelId);
    }
    onChanged();
    loadAll();
  };

  const handleAddAttachment = async (e: FormEvent) => {
    e.preventDefault();
    if (!attachmentUrl.trim() || !attachmentName.trim()) return;
    await attachmentApi.add(cardId, attachmentName.trim(), attachmentUrl.trim());
    setAttachmentName('');
    setAttachmentUrl('');
    loadAll();
  };

  const handleArchive = async () => {
    await cardApi.archive(cardId);
    onChanged();
    onClose();
  };

  if (!card) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        {error && <div className="error-text">{error}</div>}

        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleSave} />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} onBlur={handleSave} />
        </div>

        <div className="field">
          <label>Due date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} onBlur={handleSave} />
        </div>

        <div className="modal-section">
          <h4>Labels</h4>
          <div className="chip-row">
            {boardLabels.map((label) => {
              const active = card.labels.some((l) => l.id === label.id);
              return (
                <button
                  key={label.id}
                  className="chip"
                  style={{
                    background: label.color,
                    color: 'white',
                    opacity: active ? 1 : 0.4,
                    border: 'none',
                  }}
                  onClick={() => toggleLabel(label.id)}
                >
                  {label.name}
                </button>
              );
            })}
            {boardLabels.length === 0 && <p style={{ fontSize: 13 }}>No labels on this board yet.</p>}
          </div>
        </div>

        <div className="modal-section">
          <h4>Attachments</h4>
          {attachments.map((a) => (
            <div key={a.id} style={{ fontSize: 13, marginBottom: 4 }}>
              <a href={a.url} target="_blank" rel="noreferrer">{a.fileName}</a>
              {' '}<span style={{ color: '#97a0af' }}>({a.uploadedBy.name})</span>
            </div>
          ))}
          <form className="new-entity-form" onSubmit={handleAddAttachment}>
            <input placeholder="File name" value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} />
            <input placeholder="URL" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} />
            <button className="btn secondary" type="submit">Add</button>
          </form>
          <p style={{ fontSize: 11, color: '#97a0af' }}>
            Attachments are stored as links only; upload your file elsewhere (e.g. Drive/S3) and paste the URL here.
          </p>
        </div>

        <div className="modal-section">
          <h4>Comments</h4>
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <span className="author">{c.author.name}</span>
              <span className="timestamp">{new Date(c.createdAt).toLocaleString()}</span>
              <p style={{ margin: '4px 0 0' }}>{c.content}</p>
            </div>
          ))}
          <form className="new-entity-form" onSubmit={handleAddComment}>
            <input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button className="btn secondary" type="submit">Comment</button>
          </form>
        </div>

        <div className="modal-section">
          <button className="btn danger" onClick={handleArchive}>Archive card</button>
        </div>
      </div>
    </div>
  );
}
