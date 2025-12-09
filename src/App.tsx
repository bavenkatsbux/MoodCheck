import { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './firebase';
import { collection, addDoc, query, onSnapshot, Timestamp, where } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';

interface MoodEntry {
  id: string;
  mood: string;
  note: string;
  timestamp: Timestamp | null;
  uid: string;
}

const MOODS = [
  { emoji: '😡', label: 'Angry' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '🤩', label: 'Great' }
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false); // Data loading
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Monitor Data (only when user is logged in)
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'moods'),
      where('uid', '==', user.uid)
      // orderBy and limit removed for debugging
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MoodEntry[];

      // Client-side sort for debugging
      data.sort((a, b) => {
        const ta = a.timestamp?.toMillis() || 0;
        const tb = b.timestamp?.toMillis() || 0;
        return tb - ta;
      });

      setEntries(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching data:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentMood(null);
      setNote('');
    } catch (error) {
      console.error("Logout failed:", error);
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

  const handleSubmit = async () => {
    if (!currentMood) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'moods'), {
        mood: currentMood,
        note: note.trim(),
        timestamp: Timestamp.now(),
        uid: user.uid
      });
      // Reset form
      setCurrentMood(null);
      setNote('');
    } catch (e: any) {
      console.error(e);
      alert("Error saving: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="loading-spinner">Initializing MoodCheck...</div>;
  }

  if (!user) {
    return (
      <div className="container">
        <h1>MoodCheck</h1>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>
            Track your mood privately. Sign in to start.
          </p>
          <button className="submit-btn" onClick={handleLogin}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>MoodCheck</h1>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>

      <div className="glass-panel">
        <p style={{ marginBottom: '1rem', opacity: 0.8 }}>Welcome, {user.displayName}!</p>
        <div className="form-container">
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

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                backgroundColor: '#ffd700',
                color: '#333',
                padding: '15px 30px',
                fontSize: '18px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                position: 'relative',
                zIndex: 1000,
                opacity: isSubmitting || !currentMood ? 0.7 : 1
              }}
              disabled={isSubmitting || !currentMood}
            >
              {isSubmitting ? 'Saving...' : 'SUBMIT'}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', opacity: 0.9 }}>Your Recent Entries</h2>

        {error && (
          <div style={{ background: 'rgba(255, 0, 0, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,0,0,0.5)' }}>
            Error loading data: {error}
            {error.includes('index') && <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Please check the browser console to create the required index.</p>}
          </div>
        )}

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
