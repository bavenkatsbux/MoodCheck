import { Timestamp } from 'firebase/firestore';

interface MoodEntry {
    id: string;
    mood: string;
    note: string;
    timestamp: Timestamp | null;
    uid: string;
}

interface EntryListProps {
    entries: MoodEntry[];
    loading: boolean;
    error: string | null;
    handleDelete: (id: string) => void;
}

export const EntryList = ({ entries, loading, error, handleDelete }: EntryListProps) => {
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
                            <div className="entry-mood" role="img" aria-label={`Mood: ${entry.mood}`}>
                                {entry.mood}
                            </div>
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
                                    color: 'var(--text-secondary)',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                                title="Delete Entry"
                                aria-label="Delete entry"
                                onMouseEnter={(e) => e.currentTarget.style.color = '#ff6b6b'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
