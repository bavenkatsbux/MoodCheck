interface InsightsProps {
    insights: string[];
}

export const Insights = ({ insights }: InsightsProps) => {
    if (insights.length === 0) return null;

    return (
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.8rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
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
    );
};
