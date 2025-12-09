import { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './firebase';
import { collection, addDoc, query, onSnapshot, Timestamp, where, deleteDoc, doc } from 'firebase/firestore';
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
  const [suggestion, setSuggestion] = useState<string | null>(null);

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


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await deleteDoc(doc(db, 'moods', id));
    } catch (e: any) {
      console.error("Error deleting:", e);
      alert("Failed to delete: " + e.message);
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

      // Micro-suggestion Logic
      let msg = '';
      if (currentMood === '😔') msg = "Try a 30-sec deep breath. 🌿";
      else if (currentMood === '😡') msg = "One small win: message a friend. 💭";
      else if (currentMood === '🙂' || currentMood === '🤩') msg = "Celebrate this moment! 🎉";
      else msg = "Take a moment to center yourself. ✨";

      setSuggestion(msg);
      setTimeout(() => setSuggestion(null), 10000); // Clear after 10s

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

  // Stats Logic
  const getStats = () => {
    if (entries.length === 0) return null;

    const recent = entries.slice(0, 7);
    const values = { '😡': 1, '😔': 2, '😐': 3, '🙂': 4, '🤩': 5 };
    const numValues = recent.map(e => values[e.mood as keyof typeof values] || 3);

    // Average
    const sum = numValues.reduce((a, b) => a + b, 0);
    const avg = sum / numValues.length;

    // Min/Max
    const min = Math.min(...numValues);
    const max = Math.max(...numValues);

    // Reverse Map for Display
    const reverseMap = { 1: '😡', 2: '😔', 3: '😐', 4: '🙂', 5: '🤩' };

    // Trend (Last 3 vs Previous 4)
    let trend = '➡️'; // Flat
    if (numValues.length >= 2) {
      const splitIndex = Math.min(3, Math.ceil(numValues.length / 2));
      const recentHalf = numValues.slice(0, splitIndex);
      const olderHalf = numValues.slice(splitIndex);

      const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
      const olderAvg = olderHalf.length > 0 ? olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length : recentAvg;

      const diff = recentAvg - olderAvg;
      if (diff >= 0.2) trend = '↗️';
      else if (diff <= -0.2) trend = '↘️';
    }

    // Color logic
    let avgColor = '#ffffff'; // white default
    if (avg >= 4) avgColor = '#4ade80'; // Green
    else if (avg >= 2.5) avgColor = '#facc15'; // Yellow
    else avgColor = '#f87171'; // Red

    return {
      avg: avg.toFixed(1),
      avgColor,
      min: reverseMap[min as keyof typeof reverseMap],
      max: reverseMap[max as keyof typeof reverseMap],
      trend,
      count: recent.length
    };
  };

  // Pattern Detection Logic
  const getInsights = () => {
    if (entries.length < 2) return [];

    const insights: string[] = [];
    const recent = entries.slice(0, 10); // Analyze last 10
    const values = { '😡': 1, '😔': 2, '😐': 3, '🙂': 4, '🤩': 5 };
    const numValues = recent.map(e => values[e.mood as keyof typeof values] || 3);

    // 1. Time of Day Analysis
    const hours = recent.map(e => e.timestamp?.toDate().getHours() || 12);
    const morning = hours.filter(h => h >= 5 && h < 11).length;
    const evening = hours.filter(h => h >= 17 && h < 23).length;

    if (morning / recent.length > 0.6) insights.push("Most of your recent check-ins are in the morning. 🌅");
    if (evening / recent.length > 0.6) insights.push("Most of your recent check-ins are in the evening. 🌙");

    // 2. Improvement (Last 3 vs Previous 3)
    if (numValues.length >= 6) {
      const last3 = numValues.slice(0, 3);
      const prev3 = numValues.slice(3, 6);
      const avgLast3 = last3.reduce((a, b) => a + b, 0) / 3;
      const avgPrev3 = prev3.reduce((a, b) => a + b, 0) / 3;

      if (avgLast3 - avgPrev3 >= 0.5) insights.push("Your mood has improved significantly in the last few entries! 🚀");
    }

    // 3. Tough Sequence (Two sad/angry in a row)
    if (numValues.length >= 2) {
      if (numValues[0] <= 2 && numValues[1] <= 2) {
        insights.push("Two difficult days in a row — be kind to yourself. 💜");
      }
    }

    return insights;
  };

  const stats = getStats();
  const insights = getInsights();

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
          <div className="mood-section">
            <h3 className="section-label">Select Mood</h3>
            <div className="mood-grid">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  className={`mood-btn ${currentMood === m.emoji ? 'selected' : ''}`}
                  onClick={() => setCurrentMood(m.emoji)}
                  title={m.label}
                  aria-label={m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="input-section">
            <textarea
              className="note-input"
              placeholder="How are you feeling right now? (Optional)"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="button-container">
              <button
                type="button"
                onClick={handleSubmit}
                className="submit-btn"
                style={{
                  opacity: isSubmitting || !currentMood ? 0.7 : 1
                }}
                disabled={isSubmitting || !currentMood}
              >
                {isSubmitting ? 'Saving...' : 'SUBMIT'}
              </button>
            </div>

            {suggestion && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)', animation: 'fadeIn 0.5s ease', color: 'white' }}>
                <p style={{ fontSize: '1rem', fontWeight: 500 }}>{suggestion}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(255,215,0, 0.15)', borderColor: 'rgba(255,215,0,0.3)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>Weekly Trend (Last {stats.count})</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Average</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.avgColor, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{stats.avg}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Best</div>
              <div style={{ fontSize: '1.5rem' }}>{stats.max}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Worst</div>
              <div style={{ fontSize: '1.5rem' }}>{stats.min}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Trend</div>
              <div style={{ fontSize: '1.5rem' }}>{stats.trend}</div>
            </div>
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.8rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💡 Insights
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {insights.map((insight, index) => (
              <li key={index} style={{ marginBottom: '0.5rem', fontSize: '0.95rem', opacity: 0.9, display: 'flex', gap: '8px' }}>
                <span>•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
              <div key={entry.id} className="entry-card" style={{ position: 'relative' }}>
                <div className="entry-mood">{entry.mood}</div>
                <div className="entry-content">
                  <span className="entry-date">{formatDate(entry.timestamp)}</span>
                  <p className="entry-text">{entry.note}</p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title="Delete Entry"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff6b6b'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
