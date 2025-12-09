import { type User } from 'firebase/auth';

interface HeaderProps {
    user: User | null;
    handleLogout: () => void;
    theme: 'dark' | 'light' | 'starbucks';
    toggleTheme: () => void;
}

export const Header = ({ user, handleLogout, theme, toggleTheme }: HeaderProps) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', textShadow: 'none' }}>MoodCheck</h1>
                <button
                    onClick={toggleTheme}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '4px',
                        lineHeight: 1
                    }}
                    title={`Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode`}
                    aria-label={`Switch theme from ${theme}`}
                >
                    {theme === 'dark' ? '☀️' : theme === 'light' ? '☕' : '🌙'}
                </button>
            </div>

            {user && (
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                    aria-label="Sign Out"
                >
                    Sign Out
                </button>
            )}
        </div>
    );
};
