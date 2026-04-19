import { useState, useEffect } from "react";
import api from "../../api";
import { LayoutDashboard, BookOpen, Calendar, GraduationCap, CheckCircle2, Hourglass, XCircle, User, LogOut, Mail, Phone, UserCircle, Briefcase, Building2, CreditCard, Settings } from "lucide-react";

/* ── Design tokens ─────────────────────────────────────── */
const C = {
  navy:      "#0f1c3f",
  navyLight: "#1a2d5a",
  accent:    "#1e40af",
  accentSoft:"#f5edd8",
  bg:        "#f4f6fb",
  white:     "#ffffff",
  text:      "#1a2340",
  textMuted: "#8892a4",
  border:    "#e4e8f0",
  success:   "#2e7d32",
  successBg: "#e8f5e9",
  warning:   "#b45309",
  warningBg: "#fff8e1",
  info:      "#1565c0",
  infoBg:    "#e3f2fd",
  danger:    "#c62828",
};

/* ── Helpers ────────────────────────────────────────────── */
const fmt = (v) => (v == null ? "—" : v);
const pct = (v) => (v == null ? "—" : v + "%");

/* ── Nav ────────────────────────────────────────────────── */
const NAV = [
  { id: "dashboard", label: "Vue d'ensemble",         icon: <LayoutDashboard size={18} /> },
  { id: "formation", label: "Mon Historique",         icon: <GraduationCap size={18} /> },
  { id: "cours",     label: "Mes Cours",              icon: <BookOpen size={18} /> },
  { id: "sessions",  label: "Mes Sessions",           icon: <Calendar size={18} /> },
  { id: "resultats", label: "Résultats & Certificats", icon: <CheckCircle2 size={18} /> },
];

const NAV_BOTTOM = [
  { id: "parametres", label: "Paramètres du Profil",  icon: <Settings size={18} /> }
];

/* ── Small components ───────────────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{
      background: C.white, borderRadius: 18,
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 20px rgba(15,28,63,0.06)",
      padding: 28, ...style
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 26, fontWeight: 700, color: C.navy,
      margin: "0 0 24px 0", lineHeight: 1.2
    }}>{children}</h2>
  );
}

/* Circular progress ring */
function Ring({ value = 0, size = 100, stroke = 8, color = C.accent, label, sub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(100, Math.max(0, value));
  const offset = circ - (filled / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}25`} strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{ textAlign: "center", marginTop: -size/2 - 10, position: "relative", top: -size/2 + 14 }}>
        <div style={{ fontSize: size * 0.19, fontWeight: 800, color: C.navy, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>
          {Math.round(filled)}<span style={{ fontSize: size * 0.12 }}>%</span>
        </div>
      </div>
      {label && <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, textAlign: "center" }}>{label}</div>}
      {sub   && <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: -6 }}>{sub}</div>}
    </div>
  );
}

/* Score pill */
function ScorePill({ label, value, color = C.info }) {
  const numVal = value != null ? Number(value) : null;
  const pctBar = numVal != null ? Math.min(100, numVal) : 0;
  return (
    <div style={{ flex: 1, background: C.bg, borderRadius: 14, padding: "18px 20px", border: `1px solid ${C.border}`, textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: C.navy, fontFamily: "'Cormorant Garamond', serif", marginBottom: 12 }}>
        {numVal != null ? <>{fmt(numVal)}<span style={{ fontSize: 16, fontWeight: 400, color: C.textMuted }}>%</span></> : "—"}
      </div>
      <div style={{ height: 6, background: `${color}20`, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pctBar}%`, background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

/* Status badge */
function StatusBadge({ label }) {
  const statusMap = {
    "Payé":        { bg: C.successBg, color: C.success, icon: <CheckCircle2 size={14} /> },
    "En attente":  { bg: C.warningBg, color: C.warning,  icon: <Hourglass size={14} /> },
    "Non payé":    { bg: C.warningBg, color: C.warning,  icon: <Hourglass size={14} /> },
    "En cours":    { bg: C.infoBg,    color: C.info,     icon: <BookOpen size={14} /> },
    "Certifié":    { bg: C.successBg, color: C.success,  icon: <GraduationCap size={14} /> },
    "Abandonné":   { bg: "#fce4ec",   color: C.danger,   icon: <XCircle size={14} /> },
  };
  const s = statusMap[label] || { bg: "#f0f2f8", color: C.textMuted, icon: "•" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 12, fontWeight: 700 }}>
      {s.icon} {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function ApprenantPortal({ onGoToLogin, onGoToVisitor }) {
  const [activeTab, setActiveTab]     = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions]       = useState([]);
  const [cours, setCours]             = useState([]);
  const [loading, setLoading]         = useState(false);

  // Auth state — restore from localStorage
  const [me, setMe] = useState(() => {
    try {
      const saved = localStorage.getItem("apprenant_session");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Show login screen if not logged in
  if (!me) {
    if (onGoToLogin) { onGoToLogin(); return null; }
    return null;
  }

  function handleLogout() {
    localStorage.removeItem("apprenant_session");
    setMe(null);
  }

  const [showResModal, setShowResModal] = useState(false);
  const [resFormations, setResFormations] = useState([]);
  const [resFormState, setResFormState] = useState({ formation: '', niveau_tia: '', mode_formation: 'Weekend', session_id: '' });
  const [resApiState, setResApiState] = useState(''); // '' | 'loading' | 'success' | 'error'

  const handleReserveSubmit = () => {
    setResApiState('loading');
    const payload = {
      nom: me.nom || "Utilisateur",
      prenom: me.prenom || "",
      email: me.email,
      telephone: me.telephone || "00000000",
      formation: resFormState.formation,
      niveau_tia: resFormState.niveau_tia,
      mode_formation: resFormState.mode_formation,
      profil_candidat: me.profil || 'Étudiant'
    };
    if (resFormState.session_id) {
       payload.session_id = Number(resFormState.session_id);
    }

    api.post('/apprenants', payload).then(res => {
      setResApiState('success');
      // Silently refresh the student data to get the new reservation without reloading the page
      api.get(`/apprenants/${me.id}`).then(freshRes => {
         const fresh = freshRes.data;
         if (fresh) {
           const updated = { ...me, ...fresh };
           localStorage.setItem("apprenant_session", JSON.stringify(updated));
           setMe(updated);
         }
      }).catch(console.error);

      setTimeout(() => {
        setResApiState('');
        setShowResModal(false);
      }, 1500);
    }).catch(err => {
      console.error(err);
      setResApiState('error');
    });
  };

  useEffect(() => {
    if (!me) return;
    setLoading(true);
    let done = 0;
    const total = 3;

    // Rafraîchir le profil depuis le backend pour avoir toutes les données à jour
    api.get(`/apprenants/${me.id}`).then(res => {
      const fresh = res.data;
      if (fresh) {
        const updated = { ...me, ...fresh };
        localStorage.setItem("apprenant_session", JSON.stringify(updated));
        setMe(updated);
      }
      if (++done === total) setLoading(false);
    }).catch(() => { if (++done === total) setLoading(false); });

    api.get("/sessions").then((res) => {
      const sData = res.data.data || res.data || [];
      setSessions(sData);
      if (++done === total) setLoading(false);
    }).catch(() => { if (++done === total) setLoading(false); });

    api.get(`/cours?formation=${encodeURIComponent(me.formation || '')}`).then(res => {
      setCours(res.data || []);
      if (++done === total) setLoading(false);
    }).catch(() => { if (++done === total) setLoading(false); });

    Promise.all([api.get('/formations'), api.get('/sessions')]).then(([rf, rs]) => {
        const allF = rf.data?.data || rf.data || [];
        // On affiche TOUTES les formations Actives pour permettre l'Alerte Email
        setResFormations(allF.filter(f => f.statut === 'Active'));
    }).catch(()=>{});
  }, []);

  if (loading) return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: C.bg, gap: 16 }}>
      <div style={{ width: 48, height: 48, border: `4px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: C.textMuted, fontSize: 14 }}>Chargement de votre espace…</div>
    </div>
  );

  const ini = `${(me.prenom || me.nom || "?")[0]}`.toUpperCase();
  // On filtre par session_id (la session assignée à cet apprenant)
  // Si pas de session_id, on affiche la formation principale + toutes les formations en liste d'attente (en ignorant les sessions terminées)
  const mySessions = sessions.filter(s => {
    if (s.id === me.session_id) return true; // Toujours inclure MA session
    if (s.statut === "Terminée") return false;
    const isMain = s.formation === me.formation;
    const isWaitlisted = (me.reservations_futures || []).some(r => r.formation === s.formation);
    return isMain || isWaitlisted;
  });
  
  // --- LOGIQUE FILTRES RÉSERVATION SAAS ---
  const meBase = (me?.formation || "").toLowerCase();
  let myTiaLevel = 0;
  if (meBase.includes('tia')) {
     if (meBase.includes('expert')) myTiaLevel = 3;
     else if (meBase.includes('avanc')) myTiaLevel = 2;
     else myTiaLevel = 1;
  }
  
  let maxTiaLevel = myTiaLevel;
  const futureBases = [];
  if (me?.reservations_futures && Array.isArray(me.reservations_futures)) {
    me.reservations_futures.forEach(r => {
        const fb = (r.formation || "").toLowerCase();
        futureBases.push(fb);
        if (fb.includes('tia')) {
           if (fb.includes('expert')) maxTiaLevel = Math.max(maxTiaLevel, 3);
           else if (fb.includes('avanc')) maxTiaLevel = Math.max(maxTiaLevel, 2);
           else maxTiaLevel = Math.max(maxTiaLevel, 1);
        }
    });
  }

  const availableResFormations = resFormations.filter(f => {
      const fBase = f.titre.toLowerCase();
      if (fBase.includes('tia')) return maxTiaLevel < 3;
      if (meBase.includes(fBase) || futureBases.some(fb => fb.includes(fBase))) return false;
      return true;
  });

  const isTiaSelected = resFormState.formation.toLowerCase().includes('tia');
  const availableNiveaux = [];
  if (isTiaSelected) {
      if (maxTiaLevel < 1) availableNiveaux.push("Basique");
      if (maxTiaLevel < 2) availableNiveaux.push("Avancé");
      if (maxTiaLevel < 3) availableNiveaux.push("Expert");
  }

  const finalFormationName = (isTiaSelected && resFormState.niveau_tia)
      ? `${resFormState.formation} - Niveau ${resFormState.niveau_tia}`
      : resFormState.formation;

  const mySessionDates = mySessions.filter(s => s.date_debut && s.date_fin).map(s => ({ start: new Date(s.date_debut), end: new Date(s.date_fin) }));
  if (me?.reservations_futures && Array.isArray(me.reservations_futures)) {
      me.reservations_futures.forEach(r => {
          if (r.session_id) {
             const rs = sessions.find(s => s.id == r.session_id);
             if (rs && rs.date_debut && rs.date_fin) {
                 mySessionDates.push({ start: new Date(rs.date_debut), end: new Date(rs.date_fin) });
             }
          }
      });
  }

  const availableSessionsForRes = sessions.filter(s => {
      if (s.statut !== "Planifiée" && s.statut !== "En cours") return false;
      if (s.formation !== finalFormationName && s.formation !== resFormState.formation) return false;
      
      // Strict Check: hide if session start date is already deep in the past
      if (s.date_debut) {
          const start = new Date(s.date_debut).setHours(0,0,0,0);
          const today = new Date().setHours(0,0,0,0);
          if (start < today) return false; // Past session, block registration
      }
      return true;
  }).map(s => {
      let overlap = false;
      if (s.date_debut && s.date_fin) {
          const sSt = new Date(s.date_debut);
          const sEn = new Date(s.date_fin);
          overlap = mySessionDates.some(myD => sSt <= myD.end && sEn >= myD.start);
      }
      return { ...s, overlap };
  });
  // --- FIN LOGIQUE ---

  const isPaid = me.statut === "Payé" || me.paiement === "Payé";
  const isSessionFinished = me.statut === "Certifié" || mySessions.some(s => s.date_fin && new Date(s.date_fin) < new Date());

  /* ── Tab renderers ── */

  function TabDashboard() {
    const presence = me.taux_presence != null ? Number(me.taux_presence) : null;
    const scoreTP  = me.score_tp != null ? Number(me.score_tp) : null;
    const scoreTH  = me.score_theorique != null ? Number(me.score_theorique) : null;

    const deleteReservation = (idx) => {
      if (!window.confirm("Voulez-vous vraiment annuler cette pré-inscription ?")) return;
      const newRes = [...(me.reservations_futures || [])];
      newRes.splice(idx, 1);
      api.put(`/apprenants/${me.id}`, { reservations_futures: newRes }).then(() => {
        const updated = { ...me, reservations_futures: newRes };
        localStorage.setItem("apprenant_session", JSON.stringify(updated));
        setMe(updated);
      }).catch(err => alert("Erreur système lors de l'annulation."));
    };

    const confirmSession = (sessionObj) => {
      if (!window.confirm(`Confirmer l'inscription à la session du ${new Date(sessionObj.date_debut).toLocaleDateString("fr-FR")} ?`)) return;
      
      // On retire la réservation qui a déclenché l'alerte
      const newRes = (me.reservations_futures || []).filter(r => r.formation !== sessionObj.formation);
      
      api.patch(`/apprenants/${me.id}/confirm-session`, { 
        session_id: sessionObj.id, 
        formation: sessionObj.formation || me.formation, 
        reservations_futures: newRes 
      }).then(() => {
        alert("Inscription confirmée ! Un email récapitulatif vous a été envoyé. Veuillez finaliser votre paiement au centre.");
        window.location.reload();
      }).catch(err => alert("Erreur système lors de l'inscription."));
    };

    return (
      <>
        {/* Welcome banner */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: C.navy, margin: "0 0 8px 0" }}>
              Bonjour, {me.prenom || "Étudiant"} !
            </h1>
            <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>
              Bienvenue dans votre espace d'apprentissage. {me.formation ? `Formation : ${me.formation}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
              <StatusBadge label={me.paiement || "En attente"} />
              <StatusBadge label={me.statut || "En cours"} />
              <button 
                onClick={() => setShowResModal(true)} 
                style={{ padding: "8px 16px", borderRadius: 30, background: C.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
              >
                <BookOpen size={16}/> {me.statut === "Certifié" ? "S'inscrire à un cours" : "Réserver une place"}
              </button>
            </div>
        </div>

        {/* Stats row */}
        {isSessionFinished ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
            {/* Presence ring */}
            <Card style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <Ring value={presence ?? 0} size={90} color={C.info} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Taux de présence</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                  {presence != null ? pct(presence) : "—"}
                </div>
              </div>
            </Card>

            {/* Score TP */}
            <Card style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#8e24aa18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🔧</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Score TP</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                  {scoreTP != null ? <>{fmt(scoreTP)}<span style={{ fontSize: 14, color: C.textMuted, fontWeight: 400 }}>%</span></> : "—"}
                </div>
                {scoreTP != null && (
                  <div style={{ height: 5, background: "#8e24aa20", borderRadius: 99, marginTop: 8, width: 120 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, Number(scoreTP))}%`, background: "#8e24aa", borderRadius: 99 }} />
                  </div>
                )}
              </div>
            </Card>

            {/* Score Théo */}
            <Card style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>📝</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Score Théorique</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                  {scoreTH != null ? <>{fmt(scoreTH)}<span style={{ fontSize: 14, color: C.textMuted, fontWeight: 400 }}>%</span></> : "—"}
                </div>
                {scoreTH != null && (
                  <div style={{ height: 5, background: `${C.accent}30`, borderRadius: 99, marginTop: 8, width: 120 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, Number(scoreTH))}%`, background: C.accent, borderRadius: 99 }} />
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : null}

        {/* Bottom row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Formation card */}
          <Card>
            <SectionTitle>Mon Historique</SectionTitle>
            <div style={{ background: C.bg, borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 14 }}>
                {me.formation || "Non assignée"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  ["Mode", me.mode_formation || "—"],
                  ["Statut", me.statut || "En cours"],
                  ["Profil", me.profil_candidat || "—"],
                  ["Sessions", `${mySessions.length} planifiée(s)`],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: "10px 14px", background: C.white, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Sessions card */}
          <Card>
            <SectionTitle>Prochaines Sessions</SectionTitle>
            {mySessions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {mySessions.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.accent}15`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>
                        {s.date_debut ? new Date(s.date_debut).toLocaleString("fr-FR", { month: "short" }).toUpperCase() : "—"}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, lineHeight: 1 }}>
                        {s.date_debut ? new Date(s.date_debut).getDate() : "—"}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.formation || me.formation}
                      </div>
                    </div>
                    {me.session_id !== s.id && (
                      <button 
                        onClick={() => confirmSession(s)} 
                        style={{ padding: "6px 14px", borderRadius: 8, background: C.success, color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                      >
                        S'inscrire
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.textMuted }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Calendar size={40} color={C.accent} /></div>
                <div style={{ fontSize: 14 }}>Aucune session planifiée</div>
              </div>
            )}
          </Card>
        </div>

        {/* Panier de Réservations (Waitlist) */}
        {me.reservations_futures && me.reservations_futures.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <SectionTitle>Mes Réservations (Pré-inscriptions)</SectionTitle>
            <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10 }}>
              {me.reservations_futures.map((res, idx) => {
                const isConfirmed = res.statut === "Confirmé";
                const color = isConfirmed ? C.success : C.warning;
                return (
                  <div key={idx} style={{ minWidth: 260, flexShrink: 0, padding: 20, background: C.white, borderRadius: 16, border: `1px solid ${color}40`, borderTop: `4px solid ${color}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: color, textTransform: "uppercase", marginBottom: 8, display: "flex", gap: 6, alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {isConfirmed ? <CheckCircle2 size={14}/> : <Hourglass size={14}/>} 
                        {isConfirmed ? "Session Confirmée" : "En file d'attente"}
                      </span>
                      {!isConfirmed && (
                        <button onClick={() => deleteReservation(idx)} style={{ cursor: "pointer", background: "transparent", border: "none", color: C.danger, fontWeight: 700, fontSize: 11, textDecoration: "underline", padding: 0 }}>Annuler</button>
                      )}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 4 }}>{res.formation}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>Mode: {res.mode_formation}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 12 }}>Demandée le: {new Date(res.date_demande || res.date || new Date()).toLocaleDateString("fr-FR")}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  }

  function TabFormation() {
    const mySession = mySessions.length > 0 ? mySessions[0] : null;
    return (
      <>
        {/* ── Formation choisie ── */}
        <Card style={{ marginBottom: 24 }}>
          <SectionTitle>Mon Historique</SectionTitle>
          {me.formation ? (
            <>
              {/* Hero formation */}
              <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`, borderRadius: 16, padding: "28px 32px", marginBottom: 20, color: "#fff" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, marginBottom: 8 }}>Formation choisie</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>{me.formation}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <StatusBadge label={me.statut || "En cours"} />
                  <StatusBadge label={me.paiement || "En attente"} />
                </div>
              </div>

              {/* Infos formation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {[
                  ["Mode de formation", me.mode_formation || "—", <BookOpen size={16} />],
                  ["Profil candidat",   me.profil_candidat || "—", <User size={16} />],
                  ["Date inscription",  me.date_inscription ? new Date(me.date_inscription).toLocaleDateString("fr-FR") : "—", <Calendar size={16} />],
                ].map(([label, value, icon]) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 18px", background: C.bg, borderRadius: 14, border: `1px solid ${C.border}` }}>
                    <span style={{ flexShrink: 0, color: C.accent }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textMuted }}>
              <GraduationCap size={48} color={C.textMuted} style={{ display: "block", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 16, fontWeight: 600 }}>Aucune formation assignée</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Contactez l'administration pour vous inscrire.</div>
            </div>
          )}
        </Card>

        {/* ── Session assignée ── */}
        <Card>
          <SectionTitle>Ma Session</SectionTitle>
          {mySession ? (
            <div style={{ display: "flex", gap: 20, padding: "24px", background: C.bg, borderRadius: 16, border: `1px solid ${C.accent}40`, borderLeft: `5px solid ${C.accent}` }}>
              {/* Date block */}
              <div style={{ width: 70, height: 70, borderRadius: 16, background: `${C.accent}15`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase" }}>
                  {mySession.date_debut ? new Date(mySession.date_debut).toLocaleString("fr-FR", { month: "short" }) : "—"}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.navy, lineHeight: 1, fontFamily: "'Cormorant Garamond', serif" }}>
                  {mySession.date_debut ? new Date(mySession.date_debut).getDate() : "—"}
                </div>
              </div>

              {/* Infos session */}
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  ["Formation",  mySession.formation || me.formation || "—", <GraduationCap size={15} />],
                  ["Formateur",  mySession.formateur || "—",                 <User size={15} />],
                  ["Début",      mySession.date_debut ? new Date(mySession.date_debut).toLocaleDateString("fr-FR") : "—", <Calendar size={15} />],
                  ["Fin",        mySession.date_fin   ? new Date(mySession.date_fin).toLocaleDateString("fr-FR")   : "—", "🏁"],
                  ["Statut",     mySession.statut || "Planifiée",             <CheckCircle2 size={15} />],
                ].map(([label, value, icon]) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: C.white, borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <span style={{ flexShrink: 0, color: C.accent, fontSize: 16 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textMuted }}>
              <Calendar size={48} color={C.textMuted} style={{ display: "block", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Aucune session assignée</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Votre session apparaîtra ici une fois programmée par l'administration.</div>
            </div>
          )}
        </Card>
      </>
    );
  }

  function TabCours() {
    return (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <SectionTitle>Mes Cours &amp; Supports</SectionTitle>
        </div>

        {cours && cours.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {cours.map((c, i) => {
              const url = c.chemin_fichier ? `http://localhost:3000${c.chemin_fichier}` : c.url;
              return (
                <div key={i} style={{ padding: "18px 20px", background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ fontSize: 32, lineHeight: 1 }}>{c.type === 'Vidéo' ? '🎥' : c.type === 'Archive' ? '📦' : '📄'}</div>
                    <span style={{ fontSize: 11, background: `${C.accent}15`, color: C.accent, padding: "4px 10px", borderRadius: 20, fontWeight: 700 }}>
                      {c.type || "Document"}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 6, lineHeight: 1.3 }}>{c.titre}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>Mise en ligne par <strong style={{ color: C.navy, fontWeight: 600 }}>{c.ajoute_par || 'Votre formateur'}</strong></div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Date : {new Date(c.date_ajout).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <a href={url} target="_blank" rel="noreferrer" style={{ marginTop: 16, display: "block", textAlign: "center", padding: "10px 0", background: C.white, border: `1.5px solid ${C.accent}`, color: C.accent, borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13, transition: "background 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = C.white; }} onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.accent; }}>
                    📥 Ouvrir le fichier
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.textMuted }}>
            <BookOpen size={52} color={C.textMuted} style={{ display: "block", marginBottom: 16, margin: "0 auto" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Aucun cours disponible</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Les supports de cours apparaitront ici une fois uploadés par votre formateur.</div>
          </div>
        )}
      </Card>
    );
  }

  function TabSessions() {
    return (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <SectionTitle>Mes Sessions</SectionTitle>
          <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 600 }}>{mySessions.length} session(s) trouvée(s)</div>
        </div>

        {mySessions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mySessions.map((s, i) => {
              const dateStr = s.date_debut ? new Date(s.date_debut).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : null;
              const isPast  = s.date_debut && new Date(s.date_debut) < new Date();
              return (
                <div key={i} style={{
                  display: "flex", gap: 20, padding: "20px 22px",
                  background: isPast ? "#fafbff" : C.bg,
                  borderRadius: 14,
                  border: `1px solid ${isPast ? C.border : C.accent + "40"}`,
                  borderLeft: `4px solid ${isPast ? C.border : C.accent}`,
                  opacity: isPast ? 0.75 : 1
                }}>
                  {/* Date block */}
                  <div style={{ width: 60, height: 60, borderRadius: 14, background: isPast ? "#eef0f8" : `${C.accent}15`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {s.date_debut ? (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: isPast ? C.textMuted : C.accent, textTransform: "uppercase" }}>
                          {new Date(s.date_debut).toLocaleString("fr-FR", { month: "short" })}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: isPast ? C.textMuted : C.navy, lineHeight: 1, fontFamily: "'Cormorant Garamond', serif" }}>
                          {new Date(s.date_debut).getDate()}
                        </div>
                      </>
                    ) : <span style={{ color: C.textMuted }}><Calendar size={22} /></span>}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
                      {s.formation || me.formation || "Session"}
                    </div>
                    <div style={{ display: "flex", gap: 20, fontSize: 12, color: C.textMuted, flexWrap: "wrap" }}>
                      {dateStr && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} />{dateStr}</span>}

                      {s.date_fin && <span>🏁 Fin : {new Date(s.date_fin).toLocaleDateString("fr-FR")}</span>}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20,
                      background: isPast ? "#f0f2f8" : C.successBg,
                      color: isPast ? C.textMuted : C.success
                    }}>
                      {isPast ? "✓ Passée" : "● À venir"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.textMuted }}>
            <Calendar size={52} color={C.textMuted} style={{ display: "block", marginBottom: 16, margin: "0 auto" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Aucune session planifiée</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Vos sessions apparaîtront ici une fois programmées.</div>
          </div>
        )}
      </Card>
    );
  }

  function TabResultats() {
    const presence = me.taux_presence != null ? Number(me.taux_presence) : null;
    const scoreTP  = me.score_tp != null ? Number(me.score_tp) : null;
    const scoreTH  = me.score_theorique != null ? Number(me.score_theorique) : null;
    const isCertif = me.statut === "Certifié" || me.reussite === 1;

    const moyenneGlobale = (scoreTP != null && scoreTH != null)
      ? ((scoreTP + scoreTH) / 2).toFixed(1)
      : null;

    const hasHistory = me.historique_formations && me.historique_formations.length > 0;

    if (!isSessionFinished && !hasHistory) {
      return null;
    }

    return (
      <>
        {isSessionFinished && (
          <>
            {/* Score overview */}
        <Card style={{ marginBottom: 20 }}>
          <SectionTitle>Résultats &amp; Certificats</SectionTitle>

          <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 28 }}>
            {/* Big ring */}
            <div style={{ flexShrink: 0 }}>
              <Ring
                value={presence ?? 0}
                size={120}
                stroke={10}
                color={presence != null && presence >= 80 ? C.success : presence != null && presence >= 60 ? C.warning : C.danger}
                label="Présence"
              />
            </div>

            {/* Scores */}
            <div style={{ flex: 1, display: "flex", gap: 16 }}>
              <ScorePill label="Score TP"        value={scoreTP}  color="#8e24aa" />
              <ScorePill label="Score Théorique" value={scoreTH}  color={C.info} />
              {moyenneGlobale && (
                <ScorePill label="Moyenne Globale" value={moyenneGlobale} color={C.accent} />
              )}
            </div>
          </div>

          {/* Details */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { label: "Taux de présence", value: presence != null ? pct(presence) : "—",           icon: "🕒", colorBg: `${C.info}12`,  color: C.info },
              { label: "Score TP",         value: scoreTP  != null ? `${fmt(scoreTP)}%` : "—",      icon: "🔧", colorBg: "#8e24aa12",   color: "#8e24aa" },
              { label: "Score Théorique",  value: scoreTH  != null ? `${fmt(scoreTH)}%` : "—",      icon: "📝", colorBg: `${C.accent}12`, color: C.accent },
            ].map(item => (
              <div key={item.label} style={{ padding: "18px 20px", background: item.colorBg, borderRadius: 14, border: `1px solid ${item.color}20` }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: item.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Certificate */}
        <Card>
          <SectionTitle>Certificat</SectionTitle>
          {isCertif ? (
            <div style={{
              background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 60%, #2a3f7a 100%)`,
              borderRadius: 18, padding: "40px 48px", textAlign: "center", position: "relative", overflow: "hidden"
            }}>
              {/* Decorative */}
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  position: "absolute",
                  top: `${[10,50,20,60][i]}%`, left: `${[5,80,40,10][i]}%`,
                  width: `${[120,80,100,60][i]}px`, height: `${[120,80,100,60][i]}px`,
                  borderRadius: "50%", border: `1px solid rgba(30, 64, 175,0.15)`,
                  pointerEvents: "none"
                }} />
              ))}
              <GraduationCap size={60} color={"rgba(255,255,255,0.7)"} style={{ display: "block", marginBottom: 16, margin: "0 auto" }} />
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 16 }}>
                Certificat de Réussite
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                {me.prenom} {me.nom}
              </div>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginBottom: 24 }}>
                A successfully completed the training: <strong style={{ color: "rgba(255,255,255,0.9)" }}>{me.formation}</strong>
              </p>
              <button style={{
                background: C.accent, color: "#fff", border: "none",
                padding: "13px 32px", borderRadius: 30, fontWeight: 700, fontSize: 14,
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10
              }}>
                ⬇ Télécharger le certificat
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${C.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, margin: "0 auto 20px" }}><GraduationCap size={38} /></div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.navy, fontWeight: 700, marginBottom: 8 }}>Certifiez votre parcours</div>
              <p style={{ color: C.textMuted, fontSize: 13, maxWidth: 400, margin: "0 auto 20px" }}>
                Votre certificat sera disponible une fois votre formation validée et votre statut passé à <strong>Certifié</strong>.
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.accentSoft, color: C.warning, padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Hourglass size={16} /> Formation en cours — {moyenneGlobale ? `Moyenne : ${moyenneGlobale}%` : "Résultats en attente"}</span>
              </div>
            </div>
          )}
        </Card>
        </>
        )}

        {hasHistory && (
          <div style={{ marginTop: 32 }}>
            <SectionTitle>Mes Anciens Certificats</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {me.historique_formations.map((hist, idx) => (
                <div key={idx} style={{ background: C.white, borderRadius: 14, padding: "24px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${C.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, marginBottom: 16 }}>
                    <GraduationCap size={28} />
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Formation Terminée</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 16 }}>{hist.formation}</div>
                  
                  <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                     <div style={{ padding: "6px 12px", background: "#f0f2f8", borderRadius: 8, fontSize: 11, fontWeight: 700, color: C.navy }}>TP: {hist.score_tp}%</div>
                     <div style={{ padding: "6px 12px", background: "#f0f2f8", borderRadius: 8, fontSize: 11, fontWeight: 700, color: C.navy }}>TH: {hist.score_th || hist.score_theorique}%</div>
                  </div>

                  <button style={{ width: "100%", padding: "10px", borderRadius: 8, background: C.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                    Télécharger
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  function TabParametres() {
    const [formData, setFormData] = useState({
      prenom: me.prenom || "",
      nom: me.nom || "",
      telephone: me.telephone || "",
      age: me.age || "",
      sexe: me.sexe || "",
      ancien_mdp: "",
      nouveau_mdp: "",
      confirm_mdp: ""
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSave = (e) => {
      e.preventDefault();
      
      if (formData.nouveau_mdp) {
        if (!formData.ancien_mdp) return alert("Veuillez renseigner votre ancien mot de passe.");
        if (formData.nouveau_mdp !== formData.confirm_mdp) return alert("Les nouveaux mots de passe ne correspondent pas !");
      }

      const payload = { ...formData };
      delete payload.confirm_mdp;

      if (!payload.nouveau_mdp) {
        delete payload.ancien_mdp;
        delete payload.nouveau_mdp;
      }

      api.put(`/apprenants/${me.id}`, payload).then(res => {
        alert("Profil mis à jour avec succès !");
        localStorage.setItem("apprenant_session", JSON.stringify({ 
          ...me, prenom: formData.prenom, nom: formData.nom, telephone: formData.telephone, age: formData.age, sexe: formData.sexe
        }));
        setFormData({ ...formData, ancien_mdp: "", nouveau_mdp: "", confirm_mdp: "" });
      }).catch(err => {
        alert(err.response?.data?.message || "Erreur lors de la mise à jour");
      });
    };

    return (
      <Card>
        <SectionTitle>Paramètres du Profil</SectionTitle>
        <div style={{ maxWidth: 600 }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: C.navy }}>Adresse E-mail (Non modifiable)</label>
              <input type="text" value={me.email} disabled style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#f0f2f8", color: C.textMuted, cursor: "not-allowed" }} />
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: C.navy }}>Prénom</label>
                <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}` }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: C.navy }}>Nom</label>
                <input type="text" name="nom" value={formData.nom} onChange={handleChange} required style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}` }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: C.navy }}>Téléphone</label>
                <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}` }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: C.navy }}>Âge</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} min="18" max="99" style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}` }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: C.navy }}>Sexe</label>
                <select name="sexe" value={formData.sexe} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", background: C.white }}>
                  <option value="" disabled>Sélectionnez</option>
                  <option value="Femme">Femme</option>
                  <option value="Homme">Homme</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <h4 style={{ color: C.navy, marginBottom: 12, fontSize: 14 }}>Changer le mot de passe</h4>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: C.navy }}>Ancien mot de passe</label>
                <input type="password" name="ancien_mdp" value={formData.ancien_mdp} onChange={handleChange} placeholder="••••••••" style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}` }} />
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: C.navy }}>Nouveau mot de passe</label>
                  <input type="password" name="nouveau_mdp" value={formData.nouveau_mdp} onChange={handleChange} placeholder="••••••••" style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}` }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: C.navy }}>Confirmer nouveau mot de passe</label>
                  <input type="password" name="confirm_mdp" value={formData.confirm_mdp} onChange={handleChange} placeholder="••••••••" style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}` }} />
                </div>
              </div>
            </div>

            <button type="submit" style={{ marginTop: 10, padding: "14px", borderRadius: 8, background: C.accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Enregistrer les modifications
            </button>
          </form>
        </div>
      </Card>
    );
  }

  /* ── Render ── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tab-content { animation: fadeSlideIn 0.28s cubic-bezier(0.22,1,0.36,1); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #1e40af44; border-radius: 8px; }
        .nav-btn:hover { background: rgba(30, 64, 175,0.12) !important; }
      `}</style>

      <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Sidebar ── */}
        <div style={{ width: sidebarOpen ? 260 : 0, background: C.navy, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", overflow: "hidden", transition: "width 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
          {/* Logo */}
          <div style={{ padding: "28px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>
              Waialys<span style={{ color: "#fff" }}> Formation</span>
            </div>
          </div>

          {/* Profile mini */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{ini}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis" }}>{me.prenom} {me.nom}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis" }}>{me.formation || "Apprenant"}</div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ padding: "16px 14px", flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8, paddingLeft: 8, whiteSpace: "nowrap" }}>
              Espace Étudiant
            </div>
            {NAV.filter(item => isSessionFinished || item.id !== "resultats").map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className="nav-btn"
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "11px 14px", margin: "3px 0",
                    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                    borderLeft: isActive ? `3px solid #ffffff` : "3px solid transparent",
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)",
                    border: "none", borderRadius: 10, cursor: "pointer",
                    fontSize: 14, fontWeight: isActive ? 700 : 400,
                    display: "flex", alignItems: "center", gap: 12,
                    transition: "all 0.2s", whiteSpace: "nowrap"
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>

          <div style={{ padding: "16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {NAV_BOTTOM.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className="nav-btn"
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "11px 14px", margin: "3px 0",
                    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                    borderLeft: isActive ? `3px solid #ffffff` : "3px solid transparent",
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)",
                    border: "none", borderRadius: 10, cursor: "pointer",
                    fontSize: 14, fontWeight: isActive ? 700 : 400,
                    display: "flex", alignItems: "center", gap: 12,
                    transition: "all 0.2s", whiteSpace: "nowrap"
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
          {/* Header */}
          <header style={{ height: 70, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px 0 20px", flexShrink: 0, boxShadow: "0 1px 12px rgba(15,28,63,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Hamburger */}
              <button
                onClick={() => setSidebarOpen(o => !o)}
                style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, flexShrink: 0, transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = C.white}
              >
                <span style={{ display: "block", width: 16, height: 2, background: C.navy, borderRadius: 2, transition: "all 0.25s", transform: sidebarOpen ? "none" : "rotate(45deg) translate(3px,3px)" }} />
                <span style={{ display: "block", width: 16, height: 2, background: C.navy, borderRadius: 2, transition: "all 0.25s", opacity: sidebarOpen ? 1 : 0, transform: sidebarOpen ? "none" : "scale(0)" }} />
                <span style={{ display: "block", width: 16, height: 2, background: C.navy, borderRadius: 2, transition: "all 0.25s", transform: sidebarOpen ? "none" : "rotate(-45deg) translate(3px,-3px)" }} />
              </button>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>
                {NAV.find(n => n.id === activeTab)?.label}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{me.prenom} {me.nom}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{me.formation || "Apprenant"}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, #a07840)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>
                {ini}
              </div>
              <button
                onClick={handleLogout}
                title="Se déconnecter"
                style={{ marginLeft: 4, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                onMouseOver={e => { e.currentTarget.style.background = "#fce4ec"; e.currentTarget.style.color = "#c62828"; e.currentTarget.style.borderColor = "#f8bbd0"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = C.border; }}
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "32px 40px" }}>
            <div key={activeTab} className="tab-content">
              {activeTab === "dashboard" && <TabDashboard />}
              {activeTab === "formation" && <TabFormation />}
              {activeTab === "cours"     && <TabCours />}
              {activeTab === "sessions"   && <TabSessions />}
              {activeTab === "resultats"  && <TabResultats />}
              {activeTab === "parametres" && <TabParametres />}
            </div>
            
            {/* Modal Interne de Réservation SaaS */}
            {showResModal && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,28,63,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                <div style={{ background: C.white, width: 480, maxWidth: "90%", borderRadius: 20, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", color: C.navy, margin: "0 0 16px 0", fontSize: 24 }}>Réserver une place</h2>
                  <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 24 }}>Sélectionnez une nouvelle formation. Les options indisponibles pour votre parcours ou en chevauchement sont masquées.</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Formation souhaitée *</label>
                      <select value={resFormState.formation} onChange={e => setResFormState({...resFormState, formation: e.target.value, niveau_tia: '', session_id: ''})} style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", fontSize: 14 }}>
                        <option value="" disabled>Sélectionnez une formation</option>
                        {availableResFormations.map(f => <option key={f.id} value={f.titre}>{f.titre}</option>)}
                      </select>
                    </div>

                    {isTiaSelected && (
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Niveau TIA Portal *</label>
                        <select value={resFormState.niveau_tia} onChange={e => setResFormState({...resFormState, niveau_tia: e.target.value, session_id: ''})} style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", fontSize: 14 }}>
                          <option value="" disabled>Sélectionnez votre niveau</option>
                          {availableNiveaux.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Mode de participation *</label>
                      <select value={resFormState.mode_formation} onChange={e => setResFormState({...resFormState, mode_formation: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", fontSize: 14 }}>
                        <option value="Weekend">Weekend</option>
                        <option value="1/semaine">1/semaine</option>
                        <option value="Continue">Continue</option>
                      </select>
                    </div>

                    {/* Gestion Intelligente des Sessions vs Alertes */}
                    {(finalFormationName && (!isTiaSelected || resFormState.niveau_tia)) && (
                      availableSessionsForRes.length > 0 ? (
                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Session disponible *</label>
                          <select value={resFormState.session_id} onChange={e => setResFormState({...resFormState, session_id: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", fontSize: 14 }}>
                            <option value="" disabled>Sélectionnez une session</option>
                            {availableSessionsForRes.map(s => (
                              <option key={s.id} value={s.id} disabled={s.overlap}>
                                {new Date(s.date_debut).toLocaleDateString("fr-FR")} ➔ {new Date(s.date_fin).toLocaleDateString("fr-FR")} 
                                {s.overlap ? ' [Impossible : Chevauchement de dates]' : ` (${s.inscrits}/${s.places} inscrits)`}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div style={{ background: "#eef2ff", border: "1px solid #1e40af40", borderLeft: "4px solid #1e40af", padding: "16px", borderRadius: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e3a8a", marginBottom: 4 }}>📌 Alertes Waialys AI</div>
                          <div style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.4 }}>Aucune session n'est actuellement planifiée pour cette formation.<br/>En confirmant, notre robot vous enverra un e-mail à la seconde où une place se libère !</div>
                        </div>
                      )
                    )}
                  </div>

                  {resApiState === 'error' && <div style={{ marginTop: 16, color: C.danger, fontSize: 13, fontWeight: 600 }}>Erreur inattendue. Veuillez réessayer.</div>}
                  {resApiState === 'success' && <div style={{ marginTop: 16, color: C.success, fontSize: 13, fontWeight: 600 }}>C'est noté ! Traitement en cours...</div>}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
                    <button onClick={() => setShowResModal(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "transparent", color: C.textMuted, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
                    <button 
                      disabled={!resFormState.formation || (isTiaSelected && !resFormState.niveau_tia) || (availableSessionsForRes.length > 0 && !resFormState.session_id) || resApiState === 'loading' || resApiState === 'success'} 
                      onClick={handleReserveSubmit} 
                      style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, cursor: "pointer", opacity: (!resFormState.formation || (isTiaSelected && !resFormState.niveau_tia) || (availableSessionsForRes.length > 0 && !resFormState.session_id)) ? 0.5 : 1, display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {resApiState === 'loading' ? 'Envoi...' : (availableSessionsForRes.length === 0 && finalFormationName) ? '🔔 M\'alerter par e-mail' : 'Confirmer l\'inscription'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
