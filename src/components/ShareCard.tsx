// TODO: replace with html2canvas screenshot once package is stable
import { TEAM_FLAGS, COUNTRY_FLAGS } from '../lib/constants';

interface ShareCardProps {
  type: 'rank' | 'predictions';
  displayName: string;
  country: string;
  rank: number;
  totalPoints: number;
  predictions?: { home_team: string; away_team: string; home_score: string; away_score: string }[];
}

export default function ShareCard({ type, displayName, country, rank, totalPoints, predictions }: ShareCardProps) {
  if (type === 'rank') {
    return (
      <div
        style={{
          width: 400,
          height: 220,
          background: '#0a0f1e',
          borderLeft: '4px solid #4ade80',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
        }}
      >
        {/* Green glow behind rank */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div>
          <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 900, letterSpacing: 3 }}>
            KICKSTI
          </div>
          <div style={{ color: '#4ade80', fontSize: 11, marginTop: 2 }}>
            kicksti.com
          </div>
        </div>

        {/* Center rank */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ color: '#4ade80', fontSize: 72, fontWeight: 900, lineHeight: 1 }}>
            #{rank ?? 0}
          </div>
          <div style={{ color: '#ffffff', fontSize: 11, letterSpacing: 2, marginTop: 4 }}>
            GLOBAL RANK
          </div>
          <div style={{ color: '#ffffff', fontSize: 16, marginTop: 6 }}>
            {displayName || 'Player'}
          </div>
          <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 3 }}>
            {(country && COUNTRY_FLAGS[country]) || ''} {country || ''}
          </div>
        </div>

        {/* Bottom right */}
        <div style={{ position: 'absolute', bottom: 20, right: 24, textAlign: 'right' }}>
          <div style={{ color: '#ffffff', fontSize: 16, fontWeight: 700 }}>
            {totalPoints ?? 0} pts
          </div>
          <div style={{ color: '#4ade80', fontSize: 10, marginTop: 2 }}>
            Predict to Win
          </div>
        </div>
      </div>
    );
  }

  // Predictions card
  return (
    <div
      style={{
        width: 400,
        height: 220,
        background: '#0a0f1e',
        borderLeft: '4px solid #4ade80',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 24px',
      }}
    >
      {/* Header */}
      <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
        MY PREDICTIONS
      </div>

      {/* Predictions list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(predictions || []).slice(0, 5).map((p, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              color: '#e5e7eb',
              gap: 6,
            }}
          >
            <span>{(p.home_team && TEAM_FLAGS[p.home_team]) || ''} {p.home_team || ''}</span>
            <span style={{ color: '#4ade80', fontWeight: 700, margin: '0 4px' }}>
              {p.home_score ?? '?'} - {p.away_score ?? '?'}
            </span>
            <span>{p.away_team || ''} {(p.away_team && TEAM_FLAGS[p.away_team]) || ''}</span>
          </div>
        ))}
      </div>

      {/* Bottom watermark */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <div>
          <span style={{ color: '#ffffff', fontSize: 14, fontWeight: 900, letterSpacing: 3 }}>KICKSTI</span>
          <span style={{ color: '#4ade80', fontSize: 10, marginLeft: 8 }}>kicksti.com</span>
        </div>
        <div style={{ color: '#4ade80', fontSize: 10 }}>Predict to Win</div>
      </div>
    </div>
  );
}
