interface StatsCardProps {
    stats: {
        avg: string;
        avgColor: string;
        min: string;
        max: string;
        trend: string;
        count: number;
    } | null;
}

export const StatsCard = ({ stats }: StatsCardProps) => {
    if (!stats) return null;

    return (
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
    );
};
