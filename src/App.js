import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

const C = {
  navy:   "#0A1628", blue:   "#1A3A6B", teal:   "#0D9488",
  tealLt: "#14B8A6", cyan:   "#22D3EE", white:  "#FFFFFF",
  muted:  "#94A3B8", accent: "#F59E0B", red:    "#EF4444",
  green:  "#10B981", dark:   "#0F172A", card:   "#111827",
  border: "#1E3A5F",
};

const styles = {
  app:    { minHeight:"100vh", background:C.navy, color:C.white, fontFamily:"'Segoe UI',system-ui,sans-serif" },
  header: { background:C.dark, borderBottom:`1px solid ${C.border}`, padding:"1rem 2rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem" },
  logo:   { fontSize:"1.4rem", fontWeight:700, color:C.white, margin:0 },
  logoSpan: { color:C.tealLt },
  sdg:    { fontSize:"0.75rem", color:C.teal, background:"#0D94881A", border:`1px solid ${C.teal}`, borderRadius:"4px", padding:"3px 10px" },
  nav:    { display:"flex", gap:"0.5rem" },
  navBtn: (a) => ({ padding:"0.5rem 1.2rem", borderRadius:"6px", border:`1px solid ${a?C.teal:C.border}`, background:a?"#0D94881A":"transparent", color:a?C.tealLt:C.muted, cursor:"pointer", fontWeight:a?600:400, fontSize:"0.9rem" }),
  main:   { maxWidth:"680px", margin:"0 auto", padding:"2rem 1rem" },
  card:   { background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"1.5rem", marginBottom:"1rem" },
  cardTitle: { fontSize:"1.1rem", fontWeight:600, marginBottom:"1rem", color:C.white },
  label:  { display:"block", fontSize:"0.85rem", color:C.muted, marginBottom:"0.4rem" },
  input:  { width:"100%", padding:"0.65rem 0.9rem", background:"#0A1628", border:`1px solid ${C.border}`, borderRadius:"6px", color:C.white, fontSize:"0.95rem", marginBottom:"1rem", boxSizing:"border-box", outline:"none" },
  btn:    (color=C.teal, outline=false) => ({ width:"100%", padding:"0.75rem", background:outline?"transparent":color, border:`1px solid ${color}`, borderRadius:"6px", color:outline?color:C.white, fontWeight:600, fontSize:"1rem", cursor:"pointer", marginBottom:"0.5rem" }),
  alert:  (type) => ({ padding:"0.75rem 1rem", borderRadius:"6px", marginBottom:"1rem", fontSize:"0.9rem", background:type==="error"?"#EF44441A":type==="success"?"#10B9811A":"#0D94881A", border:`1px solid ${type==="error"?C.red:type==="success"?C.green:C.teal}`, color:type==="error"?"#FCA5A5":type==="success"?"#6EE7B7":C.cyan }),
  candidateCard: (sel) => ({ padding:"1rem", border:`2px solid ${sel?C.teal:C.border}`, borderRadius:"8px", marginBottom:"0.6rem", cursor:"pointer", background:sel?"#0D94881A":"transparent", display:"flex", alignItems:"center", gap:"0.8rem" }),
  radio:  (sel) => ({ width:"18px", height:"18px", borderRadius:"50%", border:`2px solid ${sel?C.teal:C.muted}`, background:sel?C.teal:"transparent", flexShrink:0 }),
  barWrap:{ background:"#0A1628", borderRadius:"4px", height:"10px", overflow:"hidden", marginTop:"0.4rem" },
  bar:    (pct,color) => ({ height:"100%", width:`${pct}%`, background:color, borderRadius:"4px", transition:"width 0.8s ease" }),
  statRow:{ display:"flex", justifyContent:"space-between", fontSize:"0.85rem", color:C.muted, marginBottom:"0.3rem" },
  winner: { textAlign:"center", padding:"1.5rem", background:"#0D94881A", border:`1px solid ${C.teal}`, borderRadius:"10px", marginBottom:"1rem" },
};

// ── LocalStorage helpers ──────────────────────────────────────────
function saveCredentials(voterId, token, signature) {
  const all = getAll();
  all[voterId.toUpperCase()] = { token, signature, hasVoted:false, ballotRef:null, candidateVoted:null };
  localStorage.setItem("qv_credentials", JSON.stringify(all));
}
function saveBallotRef(voterId, ballotRef, candidateVoted) {
  const all = getAll();
  if (all[voterId.toUpperCase()]) {
    all[voterId.toUpperCase()].ballotRef = ballotRef;
    all[voterId.toUpperCase()].candidateVoted = candidateVoted;
    all[voterId.toUpperCase()].hasVoted = true;
    localStorage.setItem("qv_credentials", JSON.stringify(all));
  }
}
function getCredentials(voterId) { return getAll()[voterId.toUpperCase()] || null; }
function markVoted(voterId) {
  const all = getAll();
  if (all[voterId.toUpperCase()]) { all[voterId.toUpperCase()].hasVoted = true; localStorage.setItem("qv_credentials", JSON.stringify(all)); }
}
function getAll() { try { return JSON.parse(localStorage.getItem("qv_credentials")||"{}"); } catch { return {}; } }
function clearAll() { localStorage.removeItem("qv_credentials"); }

function Alert({ type, msg }) { if (!msg) return null; return <div style={styles.alert(type)}>{msg}</div>; }

// ═══════════════════════════════════════════════════════════════════
// SCREEN 1: REGISTER
// ═══════════════════════════════════════════════════════════════════
function RegisterScreen({ onNavigate }) {
  const [voterId, setVoterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(null);
  const [, forceUpdate]       = useState(0);

  async function handleRegister() {
    const id = voterId.trim().toUpperCase();
    if (!id) { setError("Please enter your voter ID."); return; }
    if (getCredentials(id)) { setError(`${id} is already registered. Go to Vote tab.`); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${API}/register`, { voter_id: id });
      saveCredentials(id, res.data.voter_token, res.data.signature);
      setSuccess({ voterId: id, candidates: res.data.candidates });
      forceUpdate(n => n+1);
    } catch(e) { setError(e.response?.data?.detail || "Registration failed. Is the server running?"); }
    finally { setLoading(false); }
  }

  if (success) return (
    <div>
      <div style={styles.alert("success")}>✓ <strong>{success.voterId}</strong> registered! Token saved automatically.</div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>You are registered!</div>
        <p style={{ color:C.muted, fontSize:"0.9rem", marginTop:0 }}>Your token is saved in this browser. Just enter your voter ID to vote — no copy-pasting needed.</p>
        <div style={{ ...styles.alert(""), marginBottom:"1rem" }}>🔐 Token saved automatically · No copy-paste needed</div>
        <button style={styles.btn(C.teal)} onClick={() => onNavigate("vote")}>Go to Vote →</button>
        <button style={styles.btn(C.blue, true)} onClick={() => { setSuccess(null); setVoterId(""); }}>Register Another Voter</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Voter Registration</div>
        <p style={{ color:C.muted, fontSize:"0.9rem", marginTop:0 }}>Enter your voter ID. Your anonymous voting token is saved automatically.</p>
        <label style={styles.label}>Voter ID</label>
        <input style={styles.input} placeholder="e.g. VOTER001" value={voterId} onChange={e=>setVoterId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRegister()}/>
        <Alert type="error" msg={error}/>
        <button style={styles.btn()} onClick={handleRegister} disabled={loading}>{loading?"Registering...":"Register & Save Token"}</button>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>How registration works</div>
        {[["1. Enter voter ID","Verified against the electoral registry."],["2. Token generated","Random 256-bit secret — no link to your ID."],["3. Token saved","Stored in browser automatically."],["4. ID forgotten","Only an irreversible hash is kept in the DB."]].map(([t,d])=>(
          <div key={t} style={{ marginBottom:"0.8rem" }}>
            <div style={{ fontWeight:600, fontSize:"0.85rem", color:C.tealLt }}>{t}</div>
            <div style={{ fontSize:"0.85rem", color:C.muted }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 2: VOTE
// ═══════════════════════════════════════════════════════════════════
function VoteScreen({ onNavigate }) {
  const [voterId, setVoterId]       = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [voterFound, setVoterFound] = useState(false);
  const [success, setSuccess]       = useState(null);

  useEffect(() => {
    axios.get(`${API}/status`).then(r=>setCandidates(r.data.candidates)).catch(()=>setCandidates(["Alice Johnson","Bob Smith","Carol White"]));
  }, []);

  function handleLookup() {
    const id = voterId.trim().toUpperCase();
    if (!id) { setError("Please enter your voter ID."); return; }
    const creds = getCredentials(id);
    if (!creds) { setError(`${id} is not registered on this device. Please register first.`); setVoterFound(false); return; }
    if (creds.hasVoted) { setError(`${id} has already voted. Go to My Receipt tab to see your ballot.`); setVoterFound(false); return; }
    setError(""); setVoterFound(true);
  }

  async function handleVote() {
    if (selected === null) { setError("Please select a candidate."); return; }
    const id = voterId.trim().toUpperCase();
    const creds = getCredentials(id);
    if (!creds) { setError("Credentials not found. Please register again."); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${API}/vote`, { token:creds.token, signature:creds.signature, candidate_index:selected });
      // ← KEY CHANGE: save ballot ref automatically
      saveBallotRef(id, res.data.ballot_ref, res.data.candidate_voted_for);
      setSuccess({ ...res.data, voterId: id });
    } catch(e) { setError(e.response?.data?.detail || "Vote failed."); }
    finally { setLoading(false); }
  }

  if (success) return (
    <div style={styles.card}>
      <div style={{ textAlign:"center", padding:"1rem 0" }}>
        <div style={{ fontSize:"3rem", marginBottom:"0.5rem" }}>🗳️</div>
        <div style={{ fontSize:"1.3rem", fontWeight:700, color:C.tealLt, marginBottom:"0.5rem" }}>Vote Cast Successfully</div>
        <div style={{ color:C.muted, fontSize:"0.9rem", marginBottom:"1.5rem" }}>Your encrypted ballot has been recorded anonymously.</div>
        <div style={{ ...styles.alert("success"), textAlign:"left" }}>
          ✓ Voted for <strong>{success.candidate_voted_for}</strong>. Your ballot receipt has been saved automatically.
        </div>
        <button style={{ ...styles.btn(C.teal), marginTop:"1rem" }} onClick={() => onNavigate("receipt")}>
          View My Receipt →
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Cast Your Vote</div>
        <label style={styles.label}>Your Voter ID</label>
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem" }}>
          <input style={{ ...styles.input, marginBottom:0, flex:1 }} placeholder="e.g. VOTER001" value={voterId}
            onChange={e=>{ setVoterId(e.target.value); setVoterFound(false); setError(""); }}
            onKeyDown={e=>e.key==="Enter"&&handleLookup()}/>
          <button onClick={handleLookup} style={{ padding:"0.65rem 1.2rem", background:C.teal, border:"none", borderRadius:"6px", color:C.white, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>Look up</button>
        </div>
        <Alert type="error" msg={error}/>
        {voterFound && (
          <>
            <div style={{ ...styles.alert("success"), marginBottom:"1rem" }}>✓ Voter found. Select your candidate below.</div>
            <label style={{ ...styles.label, marginBottom:"0.8rem" }}>Select Candidate</label>
            {candidates.map((name,i) => (
              <div key={i} style={styles.candidateCard(selected===i)} onClick={()=>setSelected(i)}>
                <div style={styles.radio(selected===i)}/>
                <div><div style={{ fontWeight:600 }}>{name}</div><div style={{ fontSize:"0.8rem", color:C.muted }}>Candidate {i+1}</div></div>
              </div>
            ))}
            <button style={{ ...styles.btn(), marginTop:"0.5rem" }} onClick={handleVote} disabled={loading}>
              {loading?"Encrypting & submitting...":"Cast Encrypted Vote"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 3: MY RECEIPT  ← NEW SCREEN
// ═══════════════════════════════════════════════════════════════════
function ReceiptScreen() {
  const [voterId, setVoterId]   = useState("");
  const [receipt, setReceipt]   = useState(null);
  const [verified, setVerified] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  function handleLookup() {
    const id = voterId.trim().toUpperCase();
    if (!id) { setError("Please enter your voter ID."); return; }
    const creds = getCredentials(id);
    if (!creds) { setError(`${id} not found on this device.`); return; }
    if (!creds.hasVoted || !creds.ballotRef) { setError(`${id} has not voted yet.`); return; }
    setError("");
    setReceipt({ voterId: id, ballotRef: creds.ballotRef, candidateVoted: creds.candidateVoted });
    setVerified(null);
  }

  async function handleVerify() {
    if (!receipt) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/bulletin`);
      const found = res.data.ballots.find(b => b.ballot_ref === receipt.ballotRef);
      setVerified(!!found);
    } catch { setVerified(false); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>My Ballot Receipt</div>
        <p style={{ color:C.muted, fontSize:"0.9rem", marginTop:0 }}>
          Enter your voter ID to view your ballot receipt and verify it was counted.
        </p>
        <label style={styles.label}>Your Voter ID</label>
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem" }}>
          <input style={{ ...styles.input, marginBottom:0, flex:1 }} placeholder="e.g. VOTER001"
            value={voterId} onChange={e=>{ setVoterId(e.target.value); setReceipt(null); setVerified(null); setError(""); }}
            onKeyDown={e=>e.key==="Enter"&&handleLookup()}/>
          <button onClick={handleLookup} style={{ padding:"0.65rem 1.2rem", background:C.teal, border:"none", borderRadius:"6px", color:C.white, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>Find Receipt</button>
        </div>
        <Alert type="error" msg={error}/>

        {receipt && (
          <div>
            {/* Receipt card — shows ONLY ballot ref, never voter or candidate */}
            <div style={{ background:"#0A1628", border:`1px solid ${C.teal}`, borderRadius:"10px", padding:"1.2rem", marginBottom:"1rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
                <div style={{ fontSize:"1rem", fontWeight:700, color:C.tealLt }}>Ballot Receipt</div>
                <div style={{ fontSize:"0.75rem", color:C.muted, background:"#0D94881A", border:`1px solid ${C.teal}`, borderRadius:"4px", padding:"2px 8px" }}>ANONYMOUS</div>
              </div>

              <div style={{ fontSize:"0.78rem", color:C.muted, marginBottom:"0.4rem" }}>Your ballot reference number</div>
              <div style={{ fontSize:"0.88rem", color:C.cyan, wordBreak:"break-all", fontFamily:"monospace", padding:"0.6rem", background:"#0A1628", border:`1px solid ${C.border}`, borderRadius:"6px" }}>
                {receipt.ballotRef}
              </div>

              <div style={{ marginTop:"1rem", fontSize:"0.82rem", color:C.muted, fontStyle:"italic" }}>
                This reference proves your vote exists on the bulletin board — without revealing who you are or what you chose.
              </div>
            </div>

            {/* Verify button */}
            {verified === null && (
              <button style={styles.btn(C.teal, true)} onClick={handleVerify} disabled={loading}>
                {loading ? "Checking bulletin board..." : "Verify my vote was counted →"}
              </button>
            )}

            {/* Verification result */}
            {verified === true && (
              <div style={styles.alert("success")}>
                ✓ Verified! Your ballot reference exists on the public bulletin board. Your vote was counted.
              </div>
            )}
            {verified === false && (
              <div style={styles.alert("error")}>
                Ballot reference not found on bulletin board. Contact election officials.
              </div>
            )}

            <div style={{ ...styles.alert(""), marginTop:"0.5rem" }}>
              Your vote is stored as an encrypted ciphertext. Even election admins cannot see who you voted for.
            </div>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>How receipt verification works</div>
        {[
          ["1. Ballot ref saved automatically","When you vote, the reference ID is stored in your browser — no copy needed."],
          ["2. Check the bulletin board","The bulletin board lists all encrypted ballots publicly. Your ref should appear there."],
          ["3. Confirms your vote was counted","If your ref is on the board, your encrypted vote was included in the tally."],
          ["4. Nobody sees your choice","The bulletin board shows ciphertexts only — not who voted for whom."],
        ].map(([t,d])=>(
          <div key={t} style={{ marginBottom:"0.8rem" }}>
            <div style={{ fontWeight:600, fontSize:"0.85rem", color:C.tealLt }}>{t}</div>
            <div style={{ fontSize:"0.85rem", color:C.muted }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 4: RESULTS
// ═══════════════════════════════════════════════════════════════════
const COLORS = [C.teal, C.accent, C.cyan, "#8B5CF6", "#EC4899"];

function ResultsScreen() {
  const [tally, setTally]       = useState(null);
  const [bulletin, setBulletin] = useState(null);
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function loadResults() {
    setLoading(true); setError("");
    try {
      const [t,b,s] = await Promise.all([axios.get(`${API}/tally`), axios.get(`${API}/bulletin`), axios.get(`${API}/status`)]);
      setTally(t.data); setBulletin(b.data); setStatus(s.data);
    } catch { setError("Could not load results. Is the server running?"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadResults(); }, []);

  return (
    <div>
      {status && (
        <div style={{ display:"flex", gap:"0.7rem", marginBottom:"1rem" }}>
          {[{label:"Registered",val:status.total_registered_voters},{label:"Votes Cast",val:status.total_votes_cast},{label:"Turnout",val:`${status.turnout_pct}%`},{label:"Status",val:status.election_status.toUpperCase()}].map(({label,val})=>(
            <div key={label} style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"0.8rem", textAlign:"center" }}>
              <div style={{ fontSize:"1.3rem", fontWeight:700, color:C.tealLt }}>{val}</div>
              <div style={{ fontSize:"0.75rem", color:C.muted }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <div style={styles.cardTitle}>Live Tally</div>
          <button onClick={loadResults} style={{ padding:"0.3rem 0.8rem", background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:"5px", cursor:"pointer", fontSize:"0.8rem" }}>
            {loading?"Loading...":"↻ Refresh"}
          </button>
        </div>
        <Alert type="error" msg={error}/>
        {tally && tally.total_votes > 0 ? (
          <>
            <div style={styles.winner}>
              <div style={{ fontSize:"0.8rem", color:C.muted, marginBottom:"0.3rem" }}>Leading Candidate</div>
              <div style={{ fontSize:"1.4rem", fontWeight:700, color:C.tealLt }}>{tally.winner}</div>
              <div style={{ fontSize:"0.85rem", color:C.muted, marginTop:"0.3rem" }}>{tally.results[tally.winner]?.votes} vote(s) · {tally.results[tally.winner]?.percentage}%</div>
            </div>
            {Object.entries(tally.results).map(([name,data],i)=>(
              <div key={name} style={{ marginBottom:"1rem" }}>
                <div style={styles.statRow}>
                  <span style={{ color:C.white, fontWeight:500 }}>{name}</span>
                  <span style={{ color:COLORS[i%COLORS.length], fontWeight:600 }}>{data.votes} vote{data.votes!==1?"s":""} · {data.percentage}%</span>
                </div>
                <div style={styles.barWrap}><div style={styles.bar(data.percentage, COLORS[i%COLORS.length])}/></div>
              </div>
            ))}
            <div style={{ fontSize:"0.78rem", color:C.muted, marginTop:"0.5rem", fontStyle:"italic" }}>{tally.method}</div>
          </>
        ) : (
          <div style={{ color:C.muted, textAlign:"center", padding:"1rem" }}>No votes cast yet.</div>
        )}
      </div>

      {bulletin && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Public Bulletin Board <span style={{ fontSize:"0.75rem", color:C.muted, fontWeight:400 }}>({bulletin.total_ballots} ballot{bulletin.total_ballots!==1?"s":""})</span></div>
          {bulletin.ballots.map((b,i)=>(
            <div key={i} style={{ padding:"0.7rem", background:"#0A1628", borderRadius:"6px", marginBottom:"0.5rem", fontSize:"0.8rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.3rem" }}>
                <span style={{ color:C.tealLt, fontWeight:600 }}>Ballot #{i+1}</span>
                <span style={{ color:C.muted }}>{new Date(b.cast_at).toLocaleTimeString()}</span>
              </div>
              <div style={{ color:C.muted }}>Ref: {b.ballot_ref}</div>
              <div style={{ color:C.muted, wordBreak:"break-all", marginTop:"0.2rem" }}>Ciphertext: {b.encrypted_ciphertext}</div>
            </div>
          ))}
        </div>
      )}

      {status && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Cryptographic Stack</div>
          {Object.entries(status.crypto).map(([k,v])=>(
            <div key={k} style={styles.statRow}>
              <span style={{ textTransform:"capitalize" }}>{k.replace(/_/g," ")}</span>
              <span style={{ color:C.tealLt, textAlign:"right", maxWidth:"55%" }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("register");
  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.logo}>Quantum<span style={styles.logoSpan}>Vote</span></h1>
        <div style={styles.nav}>
          {[{id:"register",label:"Register"},{id:"vote",label:"Vote"},{id:"receipt",label:"My Receipt"},{id:"results",label:"Results"}].map(({id,label})=>(
            <button key={id} style={styles.navBtn(screen===id)} onClick={()=>setScreen(id)}>{label}</button>
          ))}
        </div>
        <span style={styles.sdg}>SDG 16</span>
      </div>
      <div style={styles.main}>
        {screen==="register" && <RegisterScreen onNavigate={setScreen}/>}
        {screen==="vote"     && <VoteScreen onNavigate={setScreen}/>}
        {screen==="receipt"  && <ReceiptScreen/>}
        {screen==="results"  && <ResultsScreen/>}
      </div>
    </div>
  );
}