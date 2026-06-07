import { TEAM_ISO_CODES, toEnglishName } from '../lib/constants';
import { getKnockoutWinner, emptyScore, type KnockoutScore } from '../lib/bracket';

// ─────────────────────────────────────────────────────────────────────────────
// Graphical bracket — shared constants
// ─────────────────────────────────────────────────────────────────────────────
const G_MH = 64;    // match card height
const G_MW = 168;   // match card width
const G_RG = 110;   // round gap (room for ET/PEN side columns + connectors)
const G_COL_W = 34; // ET / PEN side-column width
const G_COL_GAP = 6;
const G_ROW_H = G_MH / 2 - 0.5;
const G_CHAMP_W = 200; // champion box width

interface Slot { home: string | null; away: string | null; pos: number }

// One small inline score input (used in card rows and side columns).
// In readOnly mode it renders the value as static text instead of an input.
function MiniInput({ value, onChange, win, disabled, readOnly }: {
  value: string; onChange: (v: string) => void; win: boolean; disabled?: boolean; readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <span style={{
        width: 24, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, flexShrink: 0,
        color: win ? '#059669' : '#374151',
      }}>
        {value}
      </span>
    );
  }
  return (
    <input
      type="text" inputMode="numeric" maxLength={2} value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
      onClick={e => e.stopPropagation()}
      disabled={disabled}
      style={{
        width: 24, height: 20, textAlign: 'center', fontSize: 11, fontWeight: 700,
        border: '1px solid #cbd5e1', borderRadius: 4, outline: 'none',
        background: disabled ? '#f1f5f9' : '#fff',
        color: disabled ? '#cbd5e1' : (win ? '#059669' : '#374151'),
        flexShrink: 0, padding: 0,
        cursor: disabled ? 'not-allowed' : 'text',
      }}
      onFocus={e => { if (!disabled) { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 2px rgba(5,150,105,0.18)'; } }}
      onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScoreColumn — a narrow ET / PEN column placed beside the match card.
//   header sits on top ("E.T." or "P"); two inputs align with the team rows.
//   `side` = 'right' (left half of bracket) or 'left' (right half).
// ─────────────────────────────────────────────────────────────────────────────
function ScoreColumn({ header, homeVal, awayVal, onHome, onAway, offset, side, accent, disabled, readOnly }: {
  header: string; homeVal: string; awayVal: string;
  onHome: (v: string) => void; onAway: (v: string) => void;
  offset: number; side: 'left' | 'right'; accent: string; disabled?: boolean; readOnly?: boolean;
}) {
  const posStyle = side === 'right' ? { left: G_MW + offset } : { right: G_MW + offset };
  return (
    <div style={{ position: 'absolute', top: 0, width: G_COL_W, height: G_MH, zIndex: 6, opacity: disabled ? 0.5 : 1, ...posStyle }}>
      <div style={{ position: 'absolute', top: -13, left: 0, width: '100%', textAlign: 'center',
                    fontSize: 9, fontWeight: 700, color: disabled ? '#9ca3af' : accent, letterSpacing: '0.06em' }}>
        {header}
      </div>
      <div style={{ height: G_ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MiniInput value={homeVal} onChange={onHome} win={false} disabled={disabled} readOnly={readOnly} />
      </div>
      <div style={{ height: 1, background: 'transparent' }} />
      <div style={{ height: G_ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MiniInput value={awayVal} onChange={onAway} win={false} disabled={disabled} readOnly={readOnly} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GCard — single match card in the graphical bracket
// ─────────────────────────────────────────────────────────────────────────────
function GCard({ home, away, score, label, side, readOnly, onScoreChange }: {
  home: string | null; away: string | null;
  score: KnockoutScore; label?: string;
  side: 'left' | 'right'; readOnly?: boolean;
  onScoreChange: (field: keyof KnockoutScore, value: string) => void;
}) {
  const winner = getKnockoutWinner(score, home, away);
  const ftH = parseInt(score.ft_home), ftA = parseInt(score.ft_away);
  const ftDraw = !isNaN(ftH) && !isNaN(ftA) && ftH === ftA;
  const etH = parseInt(score.et_home), etA = parseInt(score.et_away);
  const etDraw = ftDraw && !isNaN(etH) && !isNaN(etA) && etH === etA;

  // Column visibility: editable mode keys off the draw state; read-only keys off
  // whether values actually exist (so empty/greyed columns aren't shown).
  const showET = readOnly ? score.et_home !== '' : ftDraw;
  const showPEN = readOnly ? score.pen_home !== '' : ftDraw;

  const teamRow = (team: string | null, ftVal: string, onFt: (v: string) => void, isWin: boolean) => (
    <div style={{ height: G_ROW_H, display: 'flex', alignItems: 'center', gap: 5, padding: '0 6px 0 8px' }}>
      {team && TEAM_ISO_CODES[team]
        ? <img src={`https://flagcdn.com/w20/${TEAM_ISO_CODES[team]}.png`} width={14} className="rounded-sm shrink-0" alt="" />
        : <div style={{ width: 14, height: 9, background: '#e2e8f0', borderRadius: 2, flexShrink: 0 }} />}
      <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                     color: isWin ? '#059669' : '#374151', fontWeight: isWin ? 700 : 400 }}>
        {team ? toEnglishName(team) : <em style={{ color: '#9ca3af' }}>TBD</em>}
      </span>
      <MiniInput value={ftVal} onChange={onFt} win={isWin} readOnly={readOnly} />
    </div>
  );

  return (
    <div style={{ position: 'relative', width: G_MW, zIndex: ftDraw ? 15 : 1 }}>
      {label && (
        <div style={{ fontSize: 9, textAlign: 'center', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
          {label}
        </div>
      )}
      <div style={{ position: 'relative', width: G_MW }}>
        <div style={{
          width: G_MW, border: '1.5px solid #e2e8f0', borderRadius: 8,
          overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        }}>
          {teamRow(home, score.ft_home, v => onScoreChange('ft_home', v), winner === home && !!home)}
          <div style={{ height: 1, background: '#e2e8f0', margin: '0 8px' }} />
          {teamRow(away, score.ft_away, v => onScoreChange('ft_away', v), winner === away && !!away)}
        </div>

        {showET && (
          <ScoreColumn
            header="E.T." accent="#d97706" side={side} offset={G_COL_GAP} readOnly={readOnly}
            homeVal={score.et_home} awayVal={score.et_away}
            onHome={v => onScoreChange('et_home', v)} onAway={v => onScoreChange('et_away', v)}
          />
        )}
        {showPEN && (
          <ScoreColumn
            header="P" accent="#dc2626" side={side} offset={G_COL_GAP + G_COL_W + G_COL_GAP}
            homeVal={score.pen_home} awayVal={score.pen_away} disabled={readOnly ? false : !etDraw} readOnly={readOnly}
            onHome={v => onScoreChange('pen_home', v)} onAway={v => onScoreChange('pen_away', v)}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GraphChampion — gold "Champion" box shown below the Final
// ─────────────────────────────────────────────────────────────────────────────
function GraphChampion({ champion }: { champion: string | null }) {
  const iso = champion ? TEAM_ISO_CODES[champion] : null;
  return (
    <div style={{
      width: G_CHAMP_W, borderRadius: 14, padding: '14px 18px',
      background: '#fffdf7', border: '1.5px solid rgba(217,119,6,0.45)',
      boxShadow: '0 6px 18px rgba(217,119,6,0.16)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <img src="/world-cup-trophy.jpg" alt="FIFA World Cup Trophy" style={{ height: 80, width: 'auto', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#b45309', textTransform: 'uppercase', marginBottom: 8 }}>
          Champion
        </div>
        {champion ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {iso && <img src={`https://flagcdn.com/w40/${iso}.png`} width={28} alt="" className="rounded-sm shrink-0" />}
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {toEnglishName(champion)}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 13, fontStyle: 'italic', color: '#9ca3af' }}>To be decided</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BracketGraph — full graphical bracket. Editable by default; pass readOnly
// to render a non-editable view (used when viewing another user's bracket).
// ─────────────────────────────────────────────────────────────────────────────
export default function BracketGraph({
  r32, r16, qf, sf, thirdPlace, final: fin, knockoutScores, onScoreChange, readOnly,
}: {
  r32: Slot[]; r16: Slot[]; qf: Slot[]; sf: Slot[];
  thirdPlace: { home: string | null; away: string | null };
  final: { home: string | null; away: string | null };
  knockoutScores: Record<string, KnockoutScore>;
  onScoreChange?: (key: string, field: keyof KnockoutScore, value: string) => void;
  readOnly?: boolean;
}) {
  const MH = G_MH, MW = G_MW, RG = G_RG;
  const GI = 20; // gap between the two matches inside each R32 group
  const GS = 40; // extra gap between groups (on top of GI)
  const CX = (c: number) => c * (MW + RG);

  const r32Y  = (gi: number, pi: number) => gi * (2 * MH + GI + GS) + pi * (MH + GI);
  const r32Cy = (gi: number, pi: number) => r32Y(gi, pi) + MH / 2;
  const r16Cy = (gi: number) => (r32Cy(gi, 0) + r32Cy(gi, 1)) / 2;
  const r16Y  = (gi: number) => r16Cy(gi) - MH / 2;
  const qfCy  = (qi: number) => (r16Cy(qi * 2) + r16Cy(qi * 2 + 1)) / 2;
  const qfY   = (qi: number) => qfCy(qi) - MH / 2;
  const sfCy  = (qfCy(0) + qfCy(1)) / 2;
  const sfY   = sfCy - MH / 2;

  const TW = CX(8) + MW;
  const TH = r32Y(3, 1) + MH + 108;

  const leftR32 = [
    [{ k: 'R32-1', i: 1  }, { k: 'R32-4',  i: 4  }],
    [{ k: 'R32-0', i: 0  }, { k: 'R32-2',  i: 2  }],
    [{ k: 'R32-10',i: 10 }, { k: 'R32-11', i: 11 }],
    [{ k: 'R32-8', i: 8  }, { k: 'R32-9',  i: 9  }],
  ];
  const leftR16 = [{ k: 'R16-0', i: 0 }, { k: 'R16-1', i: 1 }, { k: 'R16-4', i: 4 }, { k: 'R16-5', i: 5 }];
  const leftQF = [{ k: 'QF-0', i: 0 }, { k: 'QF-1', i: 1 }];

  const rightR32 = [
    [{ k: 'R32-3',  i: 3  }, { k: 'R32-5',  i: 5  }],
    [{ k: 'R32-6',  i: 6  }, { k: 'R32-7',  i: 7  }],
    [{ k: 'R32-13', i: 13 }, { k: 'R32-15', i: 15 }],
    [{ k: 'R32-12', i: 12 }, { k: 'R32-14', i: 14 }],
  ];
  const rightR16 = [{ k: 'R16-2', i: 2 }, { k: 'R16-3', i: 3 }, { k: 'R16-6', i: 6 }, { k: 'R16-7', i: 7 }];
  const rightQF = [{ k: 'QF-2', i: 2 }, { k: 'QF-3', i: 3 }];

  function Conn({ topY, botY, outY, x1, x2, dir }: {
    topY: number; botY: number; outY: number; x1: number; x2: number; dir: 'ltr' | 'rtl';
  }) {
    const xm = dir === 'ltr' ? x1 + RG / 2 : x1 - RG / 2;
    return (
      <g stroke="#e2e8f0" strokeWidth={1.5} fill="none">
        <line x1={x1} y1={topY} x2={xm} y2={topY} />
        <line x1={xm} y1={topY} x2={xm} y2={botY} />
        <line x1={x1} y1={botY} x2={xm} y2={botY} />
        <line x1={xm} y1={outY} x2={x2} y2={outY} />
      </g>
    );
  }

  function card(k: string, home: string | null, away: string | null, side: 'left' | 'right', label?: string) {
    return (
      <GCard
        home={home} away={away} label={label} side={side} readOnly={readOnly}
        score={knockoutScores[k] || emptyScore()}
        onScoreChange={(field, val) => onScoreChange?.(k, field, val)}
      />
    );
  }

  const LABELS = [
    { col: 0, text: 'Round of 32' }, { col: 1, text: 'Round of 16' },
    { col: 2, text: 'Quarter-Finals' }, { col: 3, text: 'Semi-Finals' },
    { col: 4, text: 'Final' },
    { col: 5, text: 'Semi-Finals' }, { col: 6, text: 'Quarter-Finals' },
    { col: 7, text: 'Round of 16' }, { col: 8, text: 'Round of 32' },
  ];

  return (
    <div className="overflow-x-auto pb-6 -mx-6 px-6">
      <div className="relative mb-3" style={{ width: TW, height: 24 }}>
        {LABELS.map(({ col, text }) => (
          <div key={col} className="absolute text-center font-semibold uppercase"
               style={{ left: CX(col), width: MW, fontSize: 9, color: '#9ca3af', letterSpacing: '0.08em' }}>
            {text}
          </div>
        ))}
      </div>

      <div className="relative" style={{ width: TW, height: TH }}>
        <svg className="absolute inset-0 pointer-events-none" width={TW} height={TH}>
          {leftR32.map((_, gi) => (
            <Conn key={`l32-${gi}`} dir="ltr" topY={r32Cy(gi,0)} botY={r32Cy(gi,1)} outY={r16Cy(gi)} x1={CX(0)+MW} x2={CX(1)} />
          ))}
          {[0,1].map(qi => (
            <Conn key={`l16-${qi}`} dir="ltr" topY={r16Cy(qi*2)} botY={r16Cy(qi*2+1)} outY={qfCy(qi)} x1={CX(1)+MW} x2={CX(2)} />
          ))}
          <Conn dir="ltr" topY={qfCy(0)} botY={qfCy(1)} outY={sfCy} x1={CX(2)+MW} x2={CX(3)} />
          <line x1={CX(3)+MW} y1={sfCy} x2={CX(4)} y2={sfCy} stroke="#e2e8f0" strokeWidth={1.5} />

          {rightR32.map((_, gi) => (
            <Conn key={`r32-${gi}`} dir="rtl" topY={r32Cy(gi,0)} botY={r32Cy(gi,1)} outY={r16Cy(gi)} x1={CX(8)} x2={CX(7)+MW} />
          ))}
          {[0,1].map(qi => (
            <Conn key={`r16-${qi}`} dir="rtl" topY={r16Cy(qi*2)} botY={r16Cy(qi*2+1)} outY={qfCy(qi)} x1={CX(7)} x2={CX(6)+MW} />
          ))}
          <Conn dir="rtl" topY={qfCy(0)} botY={qfCy(1)} outY={sfCy} x1={CX(6)} x2={CX(5)+MW} />
          <line x1={CX(5)} y1={sfCy} x2={CX(4)+MW} y2={sfCy} stroke="#e2e8f0" strokeWidth={1.5} />
        </svg>

        {leftR32.map((group, gi) => group.map(({ k, i }, pi) => (
          <div key={k} className="absolute" style={{ left: CX(0), top: r32Y(gi, pi) }}>
            {card(k, r32[i]?.home??null, r32[i]?.away??null, 'right')}
          </div>
        )))}
        {leftR16.map(({ k, i }, gi) => (
          <div key={k} className="absolute" style={{ left: CX(1), top: r16Y(gi) }}>
            {card(k, r16[i]?.home??null, r16[i]?.away??null, 'right')}
          </div>
        ))}
        {leftQF.map(({ k, i }, qi) => (
          <div key={k} className="absolute" style={{ left: CX(2), top: qfY(qi) }}>
            {card(k, qf[i]?.home??null, qf[i]?.away??null, 'right')}
          </div>
        ))}
        <div className="absolute" style={{ left: CX(3), top: sfY }}>
          {card('SF-0', sf[0]?.home??null, sf[0]?.away??null, 'right', 'Semi-Final')}
        </div>
        <div className="absolute" style={{ left: CX(4), top: sfY }}>
          {card('F-0', fin.home, fin.away, 'right', 'FINAL')}
        </div>
        <div className="absolute" style={{ left: CX(4) - (G_CHAMP_W - MW) / 2, top: sfY + MH + 72 }}>
          <GraphChampion champion={getKnockoutWinner(knockoutScores['F-0'] || emptyScore(), fin.home, fin.away)} />
        </div>
        <div className="absolute" style={{ left: CX(5), top: sfY }}>
          {card('SF-1', sf[1]?.home??null, sf[1]?.away??null, 'left', 'Semi-Final')}
        </div>
        {rightQF.map(({ k, i }, qi) => (
          <div key={k} className="absolute" style={{ left: CX(6), top: qfY(qi) }}>
            {card(k, qf[i]?.home??null, qf[i]?.away??null, 'left')}
          </div>
        ))}
        {rightR16.map(({ k, i }, gi) => (
          <div key={k} className="absolute" style={{ left: CX(7), top: r16Y(gi) }}>
            {card(k, r16[i]?.home??null, r16[i]?.away??null, 'left')}
          </div>
        ))}
        {rightR32.map((group, gi) => group.map(({ k, i }, pi) => (
          <div key={k} className="absolute" style={{ left: CX(8), top: r32Y(gi, pi) }}>
            {card(k, r32[i]?.home??null, r32[i]?.away??null, 'left')}
          </div>
        )))}
        <div className="absolute" style={{ left: CX(4), top: r32Y(3, 1) + MH + 16 }}>
          {card('3rd-0', thirdPlace.home, thirdPlace.away, 'right', '3rd Place')}
        </div>
      </div>
    </div>
  );
}
