import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

interface MoodEntry {
  id: string;
  mood: string;
  note: string;
  timestamp: Timestamp | null;
}

const MOODS = [
  { emoji: '😡', label: 'Angry' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '🤩', label: 'Great' }
];

function App() {
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Real-time listener for the last 10 entries
    const q = query(
      collection(db, 'moods'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MoodEntry[];
      setEntries(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMood) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'moods'), {
        mood: currentMood,
        note: note.trim(),
        timestamp: serverTimestamp()
      });
      // Reset form
      setCurrentMood(null);
      setNote('');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save mood. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Just now';
    return timestamp.toDate().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container">
      <h1>MoodCheck</h1>

      <div className="glass-panel">
        <form onSubmit={handleSubmit}>
          <div className="mood-grid">
            {MOODS.map((m) => (
              <button
                key={m.label}
                type="button"
                className={`mood-btn ${currentMood === m.emoji ? 'selected' : ''}`}
                onClick={() => setCurrentMood(m.emoji)}
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>

          <textarea
            className="note-input"
            placeholder="How are you feeling right now?"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button
            type="submit"
            className="submit-btn"
            disabled={!currentMood || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Check In'}
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', opacity: 0.9 }}>Recent Entries</h2>

        {loading ? (
          <div className="loading-spinner">Loading history...</div>
        ) : entries.length === 0 ? (
          <div className="loading-spinner">No entries yet. Start tracking!</div>
        ) : (
          <div className="entries-list">
            {entries.map((entry) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-mood">{entry.mood}</div>
                <div className="entry-content">
                  <span className="entry-date">{formatDate(entry.timestamp)}</span>
                  <p className="entry-text">{entry.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
