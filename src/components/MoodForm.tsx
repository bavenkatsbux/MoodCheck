
interface MoodFormProps {
    moods: { emoji: string; label: string }[];
    currentMood: string | null;
    setCurrentMood: (mood: string) => void;
    note: string;
    setNote: (note: string) => void;
    handleSubmit: () => void;
    isSubmitting: boolean;
    suggestion: string | null;
    userDisplayName?: string | null;
}

export const MoodForm = ({
    moods,
    currentMood,
    setCurrentMood,
    note,
    setNote,
    handleSubmit,
    isSubmitting,
    suggestion,
    userDisplayName
}: MoodFormProps) => {
    return (
        <div className="glass-panel">
            <p style={{ marginBottom: '1rem', opacity: 0.8 }}>Welcome, {userDisplayName}!</p>
            <div className="form-container">
                <div className="mood-section">
                    <h3 className="section-label" style={{ color: 'var(--text-secondary)' }}>Select Mood</h3>
                    <div className="mood-grid" role="group" aria-label="Mood selection">
                        {moods.map((m) => (
                            <button
                                key={m.label}
                                type="button"
                                className={`mood-btn ${currentMood === m.emoji ? 'selected' : ''}`}
                                onClick={() => setCurrentMood(m.emoji)}
                                title={m.label}
                                aria-label={m.label}
                                aria-pressed={currentMood === m.emoji}
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
                        aria-label="Mood note"
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
                        <div role="status" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--glass-bg)', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)', animation: 'fadeIn 0.5s ease', color: 'var(--text-primary)' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{suggestion}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
