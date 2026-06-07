import { ArrowLeft, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

function ScoreRow({ label, points, accent }: { label: string; points: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-navy-600 last:border-b-0">
      <span className="text-sm text-text-primary">{label}</span>
      <span className={`text-sm font-bold ${accent ? 'text-accent' : 'text-white'}`}>{points}</span>
    </div>
  );
}

export default function Rules() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link to="/profile" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Profile
      </Link>

      <h2 className="text-3xl font-display text-white mb-6">RULES & SCORING</h2>

      <div className="space-y-6">
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-3">HOW IT WORKS</h3>
          <p className="text-sm text-text-primary leading-relaxed">
            Predict the final score of all FIFA World Cup 2026 matches — group stage and knockout rounds.
            Your predictions earn points based on accuracy. Compete against players
            worldwide in the Global League, against fans from your country, and against
            supporters of your favourite team.
          </p>
        </section>

        {/* GROUP STAGE SCORING */}
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-3">GROUP STAGE SCORING</h3>
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Per match</p>
          <div>
            <ScoreRow label="Correct result (Win/Draw/Loss)" points="3 pts" />
            <ScoreRow label="Exact scoreline (both teams correct)" points="5 pts" />
            <ScoreRow label="One team score correct" points="2 pts" />
            <ScoreRow label="Maximum per match" points="8 pts" accent />
          </div>
        </section>

        {/* KNOCKOUT - 90 MINS */}
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-3">KNOCKOUT - ENDS AT 90 MINUTES</h3>
          <div>
            <ScoreRow label="Correct result" points="3 pts" />
            <ScoreRow label="Exact first half scoreline" points="1 pt" />
            <ScoreRow label="Exact full time scoreline" points="5 pts" />
            <ScoreRow label="Maximum" points="9 pts" accent />
          </div>
        </section>

        {/* KNOCKOUT - EXTRA TIME */}
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-3">KNOCKOUT - GOES TO EXTRA TIME</h3>
          <div>
            <ScoreRow label="Correct result" points="3 pts" />
            <ScoreRow label="Exact first half scoreline" points="1 pt" />
            <ScoreRow label="Exact second half / full time scoreline (draw)" points="1 pt" />
            <ScoreRow label="Exact extra time first half scoreline" points="1 pt" />
            <ScoreRow label="Exact extra time final scoreline" points="5 pts" />
            <ScoreRow label="Maximum" points="11 pts" accent />
          </div>
        </section>

        {/* KNOCKOUT - PENALTIES */}
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-3">KNOCKOUT - GOES TO PENALTIES</h3>
          <div>
            <ScoreRow label="Correct result" points="3 pts" />
            <ScoreRow label="Exact first half scoreline" points="1 pt" />
            <ScoreRow label="Exact second half / full time scoreline (draw)" points="1 pt" />
            <ScoreRow label="Exact extra time first half scoreline" points="1 pt" />
            <ScoreRow label="Exact extra time second half / ET full time (draw)" points="1 pt" />
            <ScoreRow label="Correct penalty shootout (score + winner)" points="5 pts" />
            <ScoreRow label="Maximum" points="12 pts" accent />
          </div>
        </section>

        {/* Callout */}
        <div className="flex gap-3 bg-accent/5 border border-accent/20 rounded-xl p-4">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-text-primary leading-relaxed">
            All point components are fully independent. You earn points from any component regardless of getting others wrong.
          </p>
        </div>

        {/* EXAMPLES */}
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-4">SCORING EXAMPLES</h3>
          <div className="space-y-4 text-sm">
            {/* Group stage example */}
            <div className="bg-elevated border border-border rounded-lg p-3">
              <p className="text-white font-medium mb-2">Group Stage</p>
              <p className="text-gray-400 mb-2">Actual result: Brazil 5-1 Haiti</p>
              <div className="space-y-1.5">
                <p className="text-text-primary">Predict 5-1 <span className="text-accent ml-1">3 (result) + 5 (exact) = 8 pts</span></p>
                <p className="text-text-primary">Predict 5-0 <span className="text-accent ml-1">3 (result) + 2 (Brazil correct) = 5 pts</span></p>
                <p className="text-text-primary">Predict 0-1 <span className="text-accent ml-1">0 (wrong result) + 2 (Haiti correct) = 2 pts</span></p>
                <p className="text-text-primary">Predict 1-5 <span className="text-text-muted ml-1">0 pts</span></p>
              </div>
            </div>

            {/* Knockout 90 mins example */}
            <div className="bg-elevated border border-border rounded-lg p-3">
              <p className="text-white font-medium mb-2">Knockout - Ends at 90 minutes</p>
              <p className="text-gray-400 mb-2">Actual: FH 1-0, FT 2-1</p>
              <div className="space-y-1.5">
                <p className="text-text-primary">Predict FH wrong, FT 2-1 <span className="text-accent ml-1">3 (result) + 5 (exact FT) = 8 pts</span></p>
                <p className="text-text-primary">Predict FH 1-0, FT 2-1 <span className="text-accent ml-1">3 + 5 + 1 (FH) = 9 pts</span></p>
              </div>
            </div>

            {/* Knockout ET example */}
            <div className="bg-elevated border border-border rounded-lg p-3">
              <p className="text-white font-medium mb-2">Knockout - Goes to Extra Time</p>
              <p className="text-gray-400 mb-2">Actual: FH 1-0, FT 2-2, ET final 3-2</p>
              <div className="space-y-1.5">
                <p className="text-text-primary">Predict draw 2-2 FT, ET 3-2, miss all halves <span className="text-accent ml-1">3 + 1 (FT/SH) + 5 (ET final) = 9 pts</span></p>
                <p className="text-text-primary">Same + get FH 1-0 <span className="text-accent ml-1">10 pts</span></p>
                <p className="text-text-primary">Same + get ET FH correct <span className="text-accent ml-1">11 pts</span></p>
              </div>
            </div>

            {/* Knockout penalties example */}
            <div className="bg-elevated border border-border rounded-lg p-3">
              <p className="text-white font-medium mb-2">Knockout - Goes to Penalties</p>
              <p className="text-gray-400 mb-2">Actual: FH 1-0, FT 2-2, ET 3-3, Pen 4-3</p>
              <div className="space-y-1.5">
                <p className="text-text-primary">Predict draw, ET draw, pen 4-3, miss all halves <span className="text-accent ml-1">3 + 1 (FT) + 1 (ET FT) + 5 (pen) = 10 pts</span></p>
                <p className="text-text-primary">Same + get FH and ET FH correct <span className="text-accent ml-1">12 pts</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* PREDICTION LOCKOUT */}
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-3">PREDICTION LOCKOUT</h3>
          <ul className="space-y-2 text-sm text-text-primary">
            <li>- Predictions lock exactly 1 hour before each match kicks off</li>
            <li>- Freely editable until lock time</li>
            <li>- Once locked, cannot be changed</li>
            <li>- Late joiners get zero points for locked matches, no exceptions</li>
            <li>- Bracket predictions reset after group stage — you will be notified with a deadline to update</li>
          </ul>
        </section>

        {/* BRACKET RESETS */}
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-3">BRACKET RESETS</h3>
          <p className="text-sm text-text-primary mb-3">
            After each group concludes, your bracket is checked against the actual qualified teams.
          </p>
          <ul className="space-y-2 text-sm text-text-primary">
            <li>- If the correct team is in the correct slot: your prediction and all scorelines are kept</li>
            <li>- If the wrong team is in a slot: the correct team replaces them and ALL scorelines for that team's entire path to the final are wiped</li>
            <li>- You will be notified immediately of any resets</li>
            <li>- Deadline to re-enter reset predictions: 1 hour before that team's first knockout match</li>
          </ul>
        </section>

        {/* TIEBREAKERS */}
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-3">TIEBREAKERS</h3>
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Applied in order</p>
          <ol className="space-y-3 text-sm text-text-primary list-decimal list-inside">
            <li>
              <span className="text-white font-medium">Exact scoreline score</span> — 1 point per exact scoreline, 0.5 per one-team correct. Highest wins.
            </li>
            <li>
              <span className="text-white font-medium">Most correct results</span> — total count of correct W/D/L predictions.
            </li>
            <li>
              <span className="text-white font-medium">Most correct half and extra time predictions</span> — total count of correct FH, SH, ET FH, ET SH predictions.
            </li>
            <li>
              <span className="text-white font-medium">Favourite team's final tournament ranking</span> — user whose favourite team finishes highest wins.
            </li>
            <li>
              <span className="text-white font-medium">Earliest registration date and time</span> — first to sign up wins.
            </li>
          </ol>
        </section>

        {/* LEAGUES */}
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-3">LEAGUES</h3>
          <ul className="space-y-2 text-sm text-text-primary">
            <li><strong className="text-white">Global League:</strong> All players ranked together</li>
            <li><strong className="text-white">Country League:</strong> Players from your country only</li>
            <li><strong className="text-white">Favourite Team League:</strong> Fans of your chosen team</li>
            <li><strong className="text-white">Private Tournament:</strong> Custom groups you create/join with invite codes</li>
          </ul>
        </section>

        {/* CONTACT */}
        <section className="card">
          <h3 className="text-lg font-display text-accent mb-3">CONTACT</h3>
          <p className="text-sm text-text-primary mb-3">
            Have feedback or questions? Send us a message.
          </p>
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
              if (message.trim()) {
                alert('Message sent! Thank you for your feedback.');
                form.reset();
              }
            }}
            className="space-y-3"
          >
            <textarea
              name="message"
              rows={3}
              placeholder="Your message..."
              className="input-field text-sm resize-none"
              required
            />
            <button type="submit" className="btn-primary text-sm">
              Send Feedback
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
