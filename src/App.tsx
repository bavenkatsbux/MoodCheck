import { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './firebase';
import { collection, addDoc, query, onSnapshot, Timestamp, where, deleteDoc, doc } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { Header } from './components/Header';
import { StatsCard } from './components/StatsCard';
import { EntryList } from './components/EntryList';
import { MoodForm } from './components/MoodForm';
import { Insights } from './components/Insights';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light' | 'starbucks'>('dark');

  // Theme Toggle
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'starbucks';
      return 'dark';
    });
  };

  // Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Sync
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'moods'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MoodEntry[];

      // Client-side sort
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
      setTimeout(() => setSuggestion(null), 10000);

      setCurrentMood(null);
      setNote('');
    } catch (e: any) {
      console.error(e);
      alert("Error saving: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats Logic
  const getStats = () => {
    if (entries.length === 0) return null;

    const recent = entries.slice(0, 7);
    const values = { '😡': 1, '😔': 2, '😐': 3, '🙂': 4, '🤩': 5 };
    const numValues = recent.map(e => values[e.mood as keyof typeof values] || 3);

    const sum = numValues.reduce((a, b) => a + b, 0);
    const avg = sum / numValues.length;
    const min = Math.min(...numValues);
    const max = Math.max(...numValues);
    const reverseMap = { 1: '😡', 2: '😔', 3: '😐', 4: '🙂', 5: '🤩' };

    let trend = '➡️';
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

    let avgColor = '#ffffff';
    if (avg >= 4) avgColor = '#4ade80';
    else if (avg >= 2.5) avgColor = '#facc15';
    else avgColor = '#f87171';

    return {
      avg: avg.toFixed(1),
      avgColor,
      min: reverseMap[min as keyof typeof reverseMap],
      max: reverseMap[max as keyof typeof reverseMap],
      trend,
      count: recent.length
    };
  };

  // Insights Logic
  const getInsights = () => {
    if (entries.length < 2) return [];

    const insights: string[] = [];
    const recent = entries.slice(0, 10);
    const values = { '😡': 1, '😔': 2, '😐': 3, '🙂': 4, '🤩': 5 };
    const numValues = recent.map(e => values[e.mood as keyof typeof values] || 3);

    const hours = recent.map(e => e.timestamp?.toDate().getHours() || 12);
    const morning = hours.filter(h => h >= 5 && h < 11).length;
    const evening = hours.filter(h => h >= 17 && h < 23).length;

    if (morning / recent.length > 0.6) insights.push("Most of your recent check-ins are in the morning. 🌅");
    if (evening / recent.length > 0.6) insights.push("Most of your recent check-ins are in the evening. 🌙");

    if (numValues.length >= 6) {
      const last3 = numValues.slice(0, 3);
      const prev3 = numValues.slice(3, 6);
      const avgLast3 = last3.reduce((a, b) => a + b, 0) / 3;
      const avgPrev3 = prev3.reduce((a, b) => a + b, 0) / 3;
      if (avgLast3 - avgPrev3 >= 0.5) insights.push("Your mood has improved significantly in the last few entries! 🚀");
    }

    if (numValues.length >= 2) {
      if (numValues[0] <= 2 && numValues[1] <= 2) {
        insights.push("Two difficult days in a row — be kind to yourself. 💜");
      }
    }

    return insights;
  };

  const stats = getStats();
  const insights = getInsights();

  if (authLoading) return <div className="loading-spinner">Initializing MoodCheck...</div>;

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
      <Header
        user={user}
        handleLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <MoodForm
        moods={MOODS}
        currentMood={currentMood}
        setCurrentMood={setCurrentMood}
        note={note}
        setNote={setNote}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        suggestion={suggestion}
        userDisplayName={user.displayName}
      />

      <StatsCard stats={stats} />
      <Insights insights={insights} />

      <EntryList
        entries={entries}
        loading={loading}
        error={error}
        handleDelete={handleDelete}
      />
    </div>
  );
}

export default App;
