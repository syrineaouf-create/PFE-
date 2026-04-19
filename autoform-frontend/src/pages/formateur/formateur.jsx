import { useState, useEffect, useRef } from "react";
import api from "../../api";
import { Eye, EyeOff, LayoutDashboard, User, History, BookOpen, GraduationCap, Users, Calendar, CheckCircle2, Inbox, LogOut, Lock, XCircle, Save } from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────── */
const C = {
  navy:      "#0f1c3f",
  accent:    "#1e40af",
  bg:        "#f4f6fb",
  white:     "#ffffff",
  text:      "#1a2340",
  textMuted: "#8892a4",
  border:    "#e4e8f0",
  success:   "#2e7d32",
  danger:    "#c62828",
  info:      "#1565c0",
};

/* ─── Utility components ─────────────────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{
      background: C.white, borderRadius: 16,
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 16px rgba(15,28,63,0.07)",
      padding: 28, ...style
    }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, icon, color }) {
  return (
    <Card style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{
        width: 54, height: 54, borderRadius: 14,
        background: `${color}18`, color,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
        <div style={{ fontSize: 30, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: C.navy, marginTop: 4 }}>{value}</div>
      </div>
    </Card>
  );
}

function Badge({ children, color = C.accent }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      background: `${color}18`, color, fontSize: 12, fontWeight: 700
    }}>{children}</span>
  );
}

/* ─── Nav items aligned with diagram ────────────────────────── */
const NAV = [
  { id: "dashboard",   label: "Tableau de Bord",          icon: <LayoutDashboard size={18} /> },
  { id: "compte",      label: "Mon Compte",                icon: <User size={18} /> },
  { id: "historique",  label: "Historique",                icon: <History size={18} /> },
  { id: "cours",       label: "Gérer Cours",               icon: <BookOpen size={18} /> },
  { id: "suivi",       label: "Suivi & Présence",          icon: <GraduationCap size={18} /> },
  { id: "apprenants",  label: "Liste des Apprenants",      icon: <Users size={18} /> },
];

/* ══════════════════════════════════════════════════════════════ */
export default function FormateurPortal({ onGoToLogin }) {
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [formateurs, setFormateurs]     = useState([]);

  const [myFormations, setMyFormations] = useState([]);
  const [mySessions, setMySessions]     = useState([]);
  const [allApprenants, setAllApprenants] = useState([]);
  const [editMode, setEditMode]         = useState(false);
  const [editData, setEditData]         = useState({});
  const [saveMsg, setSaveMsg]           = useState("");
  // PDF upload modal state
  const [pdfModal, setPdfModal]         = useState(null); // formation object or null
  const [pdfFile, setPdfFile]           = useState(null);
  const [pdfTitle, setPdfTitle]         = useState("");
  const [pdfMsg, setPdfMsg]             = useState("");
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState({}); // { [formationId]: [{name, url}] }
  const downloadRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Auth state — restore from sessionStorage (set by centralized login page)
  const [me, setMe] = useState(() => {
    try {
      const saved = sessionStorage.getItem("formateur_session");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  function handleLogout() {
    sessionStorage.removeItem("formateur_session");
    setMe(null);
    if (onGoToLogin) onGoToLogin();
  }

  /* ── Auto-sync profile with Admin changes ── */
  useEffect(() => {
    if (me && me.id) {
      api.get(`/formateurs/${me.id}`).then(res => {
        const remote = res.data.data || res.data;
        if (remote && (remote.nom !== me.nom || remote.prenom !== me.prenom || remote.specialite !== me.specialite || remote.statut !== me.statut || remote.email !== me.email)) {
          const merged = { ...me, ...remote };
          setMe(merged);
          sessionStorage.setItem("formateur_session", JSON.stringify(merged));
        }
      }).catch(err => console.error("Sync error", err));
    }
  }, [me?.id]);

  /* ── Load formations, sessions, apprenants when me changes ── */
  useEffect(() => {
    if (!me) return;
    const fullName = `${me.prenom || ''} ${me.nom || ''}`.trim();
    // Les spécialités assignées par l'Admin
    const specs = me.specialite ? me.specialite.split(',').map(s => s.trim()).filter(Boolean) : [];

    api.get("/formations").then(res => {
      const all = res.data.data || res.data || [];
      // On affiche STRICTEMENT les formations cochées dans sa spécialité
      const filtered = all.filter(f => specs.includes(f.titre));
      setMyFormations(filtered);
      
      // Load docs for each formation
      filtered.forEach(f => {
        api.get(`/cours?formation=${encodeURIComponent(f.titre)}`).then(resCours => {
          setUploadedDocs(prev => ({ ...prev, [f.id]: resCours.data || [] }));
        }).catch(() => {});
      });
    });

    api.get("/sessions").then(res => {
      const all = res.data.data || res.data || [];
      setMySessions(all.filter(s => s.formateur === fullName || specs.includes(s.formation)));
    });

    api.get("/apprenants").then(res => {
      setAllApprenants(res.data.data || res.data || []);
    });
  }, [me]);


  /* ── CSV export helper ── */
  function downloadCSV() {
    if (!myFormations.length) return;
    const formIds = new Set(myFormations.map(f => f.titre));
    const relevant = allApprenants.filter(a =>
      a.formation && formIds.has(a.formation)
    );
    const rows = [
      ["Prénom", "Nom", "Email", "Téléphone", "Formation", "Statut paiement"],
      ...relevant.map(a => [
        a.prenom, a.nom, a.email, a.telephone || "", a.formation, a.statut_paiement || ""
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    downloadRef.current.href = url;
    downloadRef.current.download = `apprenants_${me.nom}.csv`;
    downloadRef.current.click();
    URL.revokeObjectURL(url);
  }

  /* ── Save compte ── */
  function handleSave() {
    api.put(`/formateurs/${me.id}`, editData)
      .then(res => {
        const updated = res.data.data || res.data;
        setMe(updated);
        setFormateurs(prev => prev.map(f => f.id === updated.id ? updated : f));
        setEditMode(false);
        setSaveMsg("Profil mis à jour avec succès !");
        setTimeout(() => setSaveMsg(""), 3000);
      })
      .catch(() => {
        setSaveMsg("Erreur lors de la mise à jour.");
        setTimeout(() => setSaveMsg(""), 3000);
      });
  }

  /* ── Upload PDF de cours ── */
  function handleUploadPDF() {
    setPdfLoading(true);
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('titre', pdfTitle || pdfFile.name);
    formData.append('formation', pdfModal.titre); // l'entité attend la chaîne 'formation'

    api.post(`/cours/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => {
        const doc = res.data.data || res.data;
        api.get(`/cours?formation=${encodeURIComponent(pdfModal.titre)}`).then(resCours => {
          setUploadedDocs(prev => ({
            ...prev,
            [pdfModal.id]: resCours.data || []
          }));
        });
        setPdfMsg('Fichier uploadé avec succès !');
        setPdfFile(null); setPdfTitle(''); setPdfLoading(false);
        setTimeout(() => { setPdfMsg(''); setPdfModal(null); }, 2000);
      })
      .catch(err => {
        setPdfMsg('Erreur lors de l\'upload du fichier.');
        setPdfLoading(false);
      });
  }

  /* ── Guards ── */
  if (!me) {
    // Not authenticated — redirect to login
    if (onGoToLogin) { onGoToLogin(); return null; }
    return null;
  }

  const ini = (me.prenom || me.nom || "?")[0].toUpperCase();

  /* ══════════════════════════════════════════════════════════════
     TABS CONTENT
  ══════════════════════════════════════════════════════════════ */

  /* ── 1. DASHBOARD ── */
  function TabDashboard() {
    return (
      <>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color: C.navy, margin: "0 0 6px 0" }}>
            Bonjour, {me.prenom} !
          </h1>
          <p style={{ color: C.textMuted, margin: 0, fontSize: 14 }}>
            Bienvenue dans votre tableau de bord pédagogique.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
          <StatBox label="Cours Assignés"      value={myFormations.length} icon={<BookOpen size={26} strokeWidth={2.5} />} color="#8e24aa" />
          <StatBox label="Sessions Planifiées" value={mySessions.length}   icon={<Calendar size={26} strokeWidth={2.5} />} color={C.accent} />
          <StatBox label="Statut"              value={me.statut || "Actif"} icon={<CheckCircle2 size={26} strokeWidth={2.5} />} color={C.success} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* Cours summary */}
          <Card>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: C.navy, margin: "0 0 20px 0" }}>
              Mes Cours en un coup d'œil
            </h2>
            {myFormations.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myFormations.slice(0, 5).map(f => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: C.bg, borderRadius: 10 }}>
                    <span style={{ color: C.textMuted }}><GraduationCap size={22} /></span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{f.titre}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>Durée : {f.duree || "—"}</div>
                    </div>
                    <Badge color={C.info}>Actif</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: C.textMuted }}>Aucun cours assigné.</p>
            )}
          </Card>

          {/* Prochaines sessions */}
          <Card>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: C.navy, margin: "0 0 20px 0" }}>
              Prochaines Sessions
            </h2>
            {mySessions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {mySessions.slice(0, 5).map((s, i) => (
                  <div key={i} style={{ borderLeft: `3px solid ${C.accent}`, paddingLeft: 14, paddingBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{s.formation}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>
                      {s.date_debut ? new Date(s.date_debut).toLocaleDateString("fr-FR") : "—"}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>Lieu : {s.lieu || "—"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 0", color: C.textMuted, fontSize: 13 }}>
                <Inbox size={36} color={C.textMuted} style={{ display: "block", marginBottom: 10, margin: "0 auto" }} />
                Pas de sessions planifiées.
              </div>
            )}
          </Card>
        </div>
      </>
    );
  }

  /* ── 2. MON COMPTE ── */
  function TabCompte() {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 28, alignItems: "start" }}>

        {/* Left — avatar card */}
        <Card style={{ textAlign: "center" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: `linear-gradient(135deg, ${C.navy}, #2a3d7a)`, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, margin: "0 auto 20px" }}>
            {ini}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.navy, fontFamily: "'Cormorant Garamond',serif" }}>{me.prenom} {me.nom}</div>
          <div style={{ fontSize: 13, color: C.textMuted, margin: "6px 0 12px" }}>{me.email}</div>
          <Badge color={C.success}>{me.statut || "Actif"}</Badge>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            {[
              { icon: <BookOpen size={16} />, label: "Cours assignés",    value: myFormations.length },
              { icon: <Calendar size={16} />, label: "Sessions planifiées", value: mySessions.length },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.textMuted }}>{icon} {label}</span>
                <span style={{ fontWeight: 700, color: C.navy, fontSize: 16 }}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right — edit form */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: C.navy, margin: 0 }}>Informations du Profil</h2>
            <button
              onClick={() => setEditMode(e => !e)}
              style={{ padding: "9px 22px", borderRadius: 8, border: `1px solid ${C.accent}`, background: editMode ? C.accent : "transparent", color: editMode ? C.white : C.accent, cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.2s" }}
            >
              {editMode ? "✕ Annuler" : "✏️ Modifier"}
            </button>
          </div>

          {saveMsg && (
            <div style={{ padding: "12px 18px", borderRadius: 10, background: saveMsg.includes("Erreur") ? "#ffebee" : "#e8f5e9", color: saveMsg.includes("Erreur") ? C.danger : C.success, marginBottom: 24, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              {saveMsg.includes("Erreur") ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
              {saveMsg}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {[
              { label: "Prénom",     key: "prenom" },
              { label: "Nom",        key: "nom"    },
              { label: "Email",      key: "email",      colSpan: 2 },
              { label: "Téléphone",  key: "telephone" },
              { label: "Spécialité", key: "specialite" },
            ].map(({ label, key, colSpan }) => (
              <div key={key} style={{ gridColumn: colSpan === 2 ? "1 / -1" : undefined }}>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
                {editMode ? (
                  <input
                    value={editData[key] || ""}
                    onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", transition: "border 0.2s" }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                ) : (
                  <div style={{ padding: "11px 14px", background: C.bg, borderRadius: 9, fontSize: 14, color: C.text, minHeight: 42 }}>
                    {me[key] || <span style={{ color: C.textMuted }}>—</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {editMode && (
            <button
              onClick={handleSave}
              style={{ marginTop: 28, padding: "13px 36px", background: C.navy, color: C.white, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 15, transition: "opacity 0.2s", display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.target.style.opacity = 0.85}
              onMouseLeave={e => e.target.style.opacity = 1}
            >
              <Save size={18} /> Sauvegarder les modifications
            </button>
          )}
        </Card>

        {/* ── Changer le mot de passe ── */}
        <ChangePasswordCard formateurId={me.id} />
      </div>
    );
  }

  function ChangePasswordCard({ formateurId }) {
    const [ancienMdp, setAncienMdp] = useState('');
    const [nouveauMdp, setNouveauMdp] = useState('');
    const [confirmer, setConfirmer] = useState('');
    const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }
    const [loading, setLoading] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const handleChange = async () => {
      if (nouveauMdp !== confirmer) {
        setMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
        return;
      }
      if (nouveauMdp.length < 6) {
        setMsg({ type: 'error', text: 'Le nouveau mot de passe doit faire au moins 6 caractères.' });
        return;
      }
      setLoading(true);
      try {
        await api.patch(`/formateurs/${formateurId}/change-password`, {
          ancien_mdp: ancienMdp,
          nouveau_mdp: nouveauMdp,
        });
        // Mettre à jour la session sessionStorage
        const session = JSON.parse(sessionStorage.getItem('formateur_session') || '{}');
        sessionStorage.setItem('formateur_session', JSON.stringify({ ...session }));
        setMsg({ type: 'success', text: 'Mot de passe modifié avec succès !' });
        setAncienMdp(''); setNouveauMdp(''); setConfirmer('');
      } catch (err) {
        const txt = err.response?.data?.message || 'Erreur lors du changement de mot de passe.';
        setMsg({ type: 'error', text: txt });
      } finally {
        setLoading(false);
        setTimeout(() => setMsg(null), 5000);
      }
    };

    const inputStyle = { width: '100%', padding: '11px 44px 11px 14px', borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' };

    return (
      <Card style={{ marginTop: 24, gridColumn: '1 / -1' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: C.navy, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={20} /> Changer mon mot de passe
        </h2>
        <p style={{ fontSize: 13, color: C.textMuted, margin: '0 0 24px 0' }}>
          Par sécurité, modifiez le mot de passe temporaire envoyé par email.
        </p>

        {msg && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: msg.type === 'success' ? '#e8f5e9' : '#fce4ec', color: msg.type === 'success' ? C.success : C.danger, marginBottom: 20, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            {msg.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {msg.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'Mot de passe actuel', val: ancienMdp, set: setAncienMdp, show: showOld, toggle: () => setShowOld(v => !v) },
            { label: 'Nouveau mot de passe', val: nouveauMdp, set: setNouveauMdp, show: showNew, toggle: () => setShowNew(v => !v) },
            { label: 'Confirmer le nouveau', val: confirmer, set: setConfirmer, show: showNew, toggle: () => setShowNew(v => !v) },
          ].map(({ label, val, set, show, toggle }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>{label}</div>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
                <button type="button" onClick={toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: C.textMuted, padding: 0 }}>
                  {show ? <EyeOff size={18} color="#8892a4" /> : <Eye size={18} color="#8892a4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleChange}
          disabled={loading || !ancienMdp || !nouveauMdp || !confirmer}
          style={{ marginTop: 20, padding: '12px 32px', background: ancienMdp && nouveauMdp && confirmer ? C.navy : '#ccc', color: '#fff', border: 'none', borderRadius: 10, cursor: ancienMdp && nouveauMdp && confirmer ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14 }}
        >
          {loading ? 'Mise à jour…' : '🔐 Changer le mot de passe'}
        </button>
      </Card>
    );
  }

  /* ── 3. HISTORIQUE ── */
  function TabHistorique() {
    const history = mySessions
      .filter(s => s.date_debut && new Date(s.date_debut) < new Date())
      .sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut));

    return (
      <Card>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: C.navy, margin: "0 0 24px 0" }}>
          Historique des Sessions
        </h2>
        {history.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["Formation", "Date début", "Date fin", "Lieu", "Statut"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: C.textMuted, letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((s, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: C.text, fontSize: 14 }}>{s.formation || s.titre || "—"}</td>
                  <td style={{ padding: "14px 16px", color: C.textMuted, fontSize: 13 }}>{s.date_debut ? new Date(s.date_debut).toLocaleDateString("fr-FR") : "—"}</td>
                  <td style={{ padding: "14px 16px", color: C.textMuted, fontSize: 13 }}>{s.date_fin ? new Date(s.date_fin).toLocaleDateString("fr-FR") : "—"}</td>
                  <td style={{ padding: "14px 16px", color: C.textMuted, fontSize: 13 }}>{s.lieu || "—"}</td>
                  <td style={{ padding: "14px 16px" }}><Badge color={C.success}>Terminé</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.textMuted }}>
            <Inbox size={48} color={C.textMuted} style={{ display: "block", marginBottom: 16, margin: "0 auto" }} />
            <p>Aucune session passée dans votre historique.</p>
            <p style={{ fontSize: 12 }}>Seules les sessions dont la date de début est passée apparaissent ici.</p>
          </div>
        )}
      </Card>
    );
  }

  /* ── 4. GÉRER COURS ── */
  function TabCours() {
    return (
      <>
        {/* PDF Upload Modal */}
        {pdfModal && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(10,20,50,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={e => { if (e.target === e.currentTarget) setPdfModal(null); }}
          >
            <div style={{ background: C.white, borderRadius: 20, padding: 36, width: 500, maxWidth: "92vw", boxShadow: "0 24px 64px rgba(15,28,63,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.navy, margin: 0 }}>Ajouter un Support de Cours</h3>
                <button onClick={() => setPdfModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.textMuted }}>✕</button>
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>
                Formation : <strong style={{ color: C.navy }}>{pdfModal.titre}</strong>
              </div>

              {pdfMsg && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: pdfMsg.startsWith("✅") ? "#e8f5e9" : "#ffebee", color: pdfMsg.startsWith("✅") ? C.success : C.danger, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
                  {pdfMsg}
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Titre du document</div>
                <input
                  type="text"
                  placeholder="Ex: Chapitre 1 — Introduction"
                  value={pdfTitle}
                  onChange={e => setPdfTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>

              {/* Zone drag & drop */}
              <div
                onClick={() => pdfInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setPdfFile(f); }}
                style={{
                  border: `2px dashed ${pdfFile ? C.accent : C.border}`,
                  borderRadius: 14, padding: "32px 20px", textAlign: "center",
                  cursor: "pointer", marginBottom: 20,
                  background: pdfFile ? `${C.accent}08` : C.bg, transition: "all 0.2s"
                }}
              >
                <input ref={pdfInputRef} type="file" accept="*/*" style={{ display: "none" }}
                  onChange={e => setPdfFile(e.target.files[0] || null)} />
                {pdfFile ? (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                    <div style={{ fontWeight: 700, color: C.navy, fontSize: 14 }}>{pdfFile.name}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{(pdfFile.size / 1024).toFixed(1)} Ko</div>
                    <div style={{ fontSize: 12, color: C.accent, marginTop: 8 }}>Cliquer pour changer de fichier</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>📂</div>
                    <div style={{ fontWeight: 600, color: C.navy, fontSize: 14 }}>Glisser-déposer un fichier ici</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>ou cliquer pour parcourir vos fichiers</div>
                    <div style={{ marginTop: 10, display: "inline-block", padding: "3px 14px", background: C.white, borderRadius: 20, fontSize: 11, color: C.textMuted, border: `1px solid ${C.border}` }}>Tout format accepté (PDF, Image, Vidéo, Archive...)</div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleUploadPDF}
                  disabled={pdfLoading || !pdfFile}
                  style={{ flex: 1, padding: "13px 0", background: pdfFile ? C.navy : "#ccc", color: C.white, border: "none", borderRadius: 10, cursor: pdfFile ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 15, opacity: pdfLoading ? 0.6 : 1 }}
                >
                  {pdfLoading ? "Upload en cours…" : "📤 Uploader le fichier"}
                </button>
                <button
                  onClick={() => setPdfModal(null)}
                  style={{ padding: "13px 24px", background: C.bg, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 15 }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: C.navy, margin: 0 }}>
            Mes Formations ({myFormations.length})
          </h2>
        </div>

        {myFormations.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 28 }}>
            {myFormations.map(f => {
              const sessionsCours = mySessions.filter(s => s.formation === f.titre);
              const docs = uploadedDocs[f.id] || [];
              return (
                <Card key={f.id} style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <img
                    src={f.titre.toLowerCase().includes('tia portal') ? '/Tia.png' : f.titre.toLowerCase().includes('scada') ? '/scada.png' : f.titre.toLowerCase().includes('eplan') ? '/eplan.png' : f.titre.toLowerCase().includes('industrie') ? '/industtrie4.0.png' : f.titre.toLowerCase().includes('solidworks') ? '/solidworks.png' : `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=700&q=80&sig=${f.id}`}
                    alt={f.titre}
                    style={{ width: "100%", height: 180, objectFit: "cover" }}
                  />
                  <div style={{ padding: "22px 22px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <Badge color={C.info}>{f.categorie || "Formation"}</Badge>
                    <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 21, color: C.navy, margin: "10px 0 8px" }}>{f.titre}</h3>
                    <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 14px", lineHeight: 1.6, flex: 1 }}>
                      {f.description ? f.description.substring(0, 130) + "…" : "Pas de description."}
                    </p>

                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.textMuted, marginBottom: 14 }}>
                      <span>⏱ {f.duree || "—"}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> {sessionsCours.length} session(s)</span>
                      <span>📄 {docs.length} Fichier(s)</span>
                    </div>

                    {/* Liste des PDFs */}
                    {docs.length > 0 && (
                      <div style={{ marginBottom: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Supports de cours</div>
                        {docs.map((doc, i) => (
                          <a key={i} href={doc.chemin_fichier ? 'http://localhost:3000' + doc.chemin_fichier : doc.url} target="_blank" rel="noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fff8f0", borderRadius: 8, marginBottom: 6, textDecoration: "none", border: `1px solid ${C.accent}35` }}
                          >
                            <span style={{ fontSize: 18 }}>{doc.type === 'Vidéo' ? '🎥' : doc.type === 'Archive' ? '📦' : '📄'}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.titre || doc.name}</span>
                            <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, flexShrink: 0 }}>Ouvrir ↗</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Sessions */}
                    {sessionsCours.length > 0 && (
                      <div style={{ marginBottom: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Sessions planifiées</div>
                        {sessionsCours.slice(0, 2).map((s, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.text, padding: "6px 0 6px 10px", borderLeft: `2px solid ${C.accent}`, marginBottom: 6 }}>
                            <span>{s.date_debut ? new Date(s.date_debut).toLocaleDateString("fr-FR") : "—"}</span>
                            <span style={{ color: C.textMuted, fontSize: 12 }}>{s.lieu || "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      disabled={me.statut !== "Actif"}
                      onClick={() => { setPdfModal(f); setPdfFile(null); setPdfTitle(""); setPdfMsg(""); }}
                      style={{
                        width: "100%", padding: "11px 0",
                        background: me.statut === "Actif" ? `${C.accent}15` : "#f5f5f5",
                        color: me.statut === "Actif" ? C.accent : "#b0b0b0",
                        border: `1.5px solid ${me.statut === "Actif" ? C.accent : "#e0e0e0"}`,
                        borderRadius: 10, cursor: me.statut === "Actif" ? "pointer" : "not-allowed",
                        fontWeight: 700, fontSize: 14, marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s"
                      }}
                      title={me.statut !== "Actif" ? "Votre compte doit être actif pour ajouter des cours" : ""}
                      onMouseEnter={e => { if(me.statut === "Actif") { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = C.white; } }}
                      onMouseLeave={e => { if(me.statut === "Actif") { e.currentTarget.style.background = `${C.accent}15`; e.currentTarget.style.color = C.accent; } }}
                    >
                      📎 Ajouter un support
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card style={{ textAlign: "center", padding: "60px 0" }}>
            <BookOpen size={48} color={C.textMuted} style={{ display: "block", marginBottom: 16, margin: "0 auto" }} />
            <p style={{ color: C.textMuted }}>Aucune formation ne vous est assignée pour le moment.</p>
          </Card>
        )}
      </>
    );
  }

  /* ── 5. SUIVI & PRESENCE ── */
  function TabSuivi() {
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [edits, setEdits] = useState({}); // { apprenantId: { score_theorique, score_tp, taux_presence } }
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuiviMsg, setSaveSuiviMsg] = useState(null);

    // Filter apprenants for the selected session
    // Usually an apprenant belongs to a formation, so we find the session's formation and get all apprenants in it.
    const selSession = mySessions.find((s) => s.id === Number(selectedSessionId));
    let sessionApprenants = [];
    let sessionAnciens = [];
    if (selSession) {
      sessionApprenants = allApprenants.filter((a) => a.session_id === selSession.id);
      sessionAnciens = allApprenants.filter((a) => a.formation === selSession.formation && a.session_id !== selSession.id);
    }
    const [absenceModalApprenant, setAbsenceModalApprenant] = useState(null);

    const handleEditChange = (id, field, value) => {
      setEdits((prev) => {
        const exist = prev[id] || {};
        return { ...prev, [id]: { ...exist, [field]: value } };
      });
    };

    const handleSaveSuivi = async () => {
      setIsSaving(true);
      setSaveSuiviMsg(null);
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < sessionApprenants.length; i++) {
        const a = sessionApprenants[i];
        const changes = edits[a.id];
        
        if (changes) {
          let aAbsences = changes.absences !== undefined ? changes.absences : [];
          if (changes.absences === undefined) {
             if (Array.isArray(a.absences)) aAbsences = a.absences;
             else if (typeof a.absences === 'string') aAbsences = a.absences.split(',').filter(Boolean);
          }
          
          let sJours = [];
          if (Array.isArray(selSession.jours_appel)) sJours = selSession.jours_appel;
          else if (typeof selSession.jours_appel === 'string') sJours = selSession.jours_appel.split(',').filter(Boolean);
          
          const tauxCalculated = sJours.length === 0 ? 100 : Math.max(0, Math.round(((sJours.length - aAbsences.length) / sJours.length) * 100));

          const payload = { absences: aAbsences, taux_presence: tauxCalculated };
          if (changes.score_theorique !== undefined) payload.score_theorique = parseFloat(changes.score_theorique);
          if (changes.score_tp !== undefined) payload.score_tp = parseFloat(changes.score_tp);

          try {
            await api.put(`/apprenants/${a.id}`, payload);
            successCount++;
          } catch (e) {
            errorCount++;
          }
        }
      }

      for (let i = 0; i < sessionAnciens.length; i++) {
        const a = sessionAnciens[i];
        const changes = edits[a.id];
        if (changes) {
          const payload = {};
          if (changes.score_theorique !== undefined) payload.score_theorique = parseFloat(changes.score_theorique);
          if (changes.score_tp !== undefined) payload.score_tp = parseFloat(changes.score_tp);
          if (changes.taux_presence !== undefined) payload.taux_presence = parseFloat(changes.taux_presence);
          
          try {
            await api.put(`/apprenants/${a.id}`, payload);
            successCount++;
          } catch (e) { errorCount++; }
        }
      }

      setIsSaving(false);
      if (errorCount > 0) {
        setSaveSuiviMsg({ type: "error", text: `Erreur sur ${errorCount} apprenant(s).` });
      } else {
        setSaveSuiviMsg({ type: "success", text: `✅ Sauvegardé avec succès ! (${successCount} mis à jour)` });
        setEdits({});
        // Reload all apprenants to get updated values
        api.get("/apprenants").then((res) => {
          setAllApprenants(res.data.data || res.data || []);
        });
      }
      setTimeout(() => setSaveSuiviMsg(null), 4000);
    };

    const handleAddAppelDate = async () => {
      const d = window.prompt("Entrez la date de la séance (ex: YYYY-MM-DD) :", new Date().toISOString().split('T')[0]);
      if (!d) return;
      
      let currentDates = [];
      if (Array.isArray(selSession.jours_appel)) currentDates = selSession.jours_appel;
      else if (typeof selSession.jours_appel === 'string') currentDates = selSession.jours_appel.split(',').filter(Boolean);
      
      if (currentDates.includes(d)) return alert("Cette séance a déjà été enregistrée.");
      
      const newDates = [...currentDates, d].sort();
      const updatedSess = { ...selSession, jours_appel: newDates };
      setMySessions(mySessions.map(s => s.id === selSession.id ? updatedSess : s));
      
      api.put(`/sessions/${selSession.id}`, { jours_appel: newDates }).catch(e => alert("Erreur serveur lors de la sauvegarde de la date."));
    };

    return (
      <div style={{ paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 700, color: C.navy, margin: "0 0 6px 0" }}>Suivi & Présence</h1>
            <p style={{ fontSize: 14, color: C.textMuted }}>Évaluer les apprenants et gérer les feuilles d'appel.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {saveSuiviMsg && (
              <span style={{ padding: "10px 16px", borderRadius: 8, background: saveSuiviMsg.type === "success" ? "#e8f5e9" : "#fce4ec", color: saveSuiviMsg.type === "success" ? C.success : C.danger, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center" }}>
                {saveSuiviMsg.text}
              </span>
            )}
            <button
              onClick={handleSaveSuivi}
              disabled={isSaving || Object.keys(edits).length === 0}
              style={{
                padding: "10px 24px", background: Object.keys(edits).length > 0 ? C.navy : C.border,
                color: Object.keys(edits).length > 0 ? C.white : C.textMuted,
                border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14,
                cursor: Object.keys(edits).length > 0 ? "pointer" : "not-allowed",
                transition: "all 0.2s"
              }}
            >
              {isSaving ? "⏳ Enregistrement..." : "💾 Sauvegarder"}
            </button>
          </div>
        </div>

        <Card style={{ marginBottom: 24, padding: "20px 28px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>1. Sélectionner une Session Active</label>
          <select
            value={selectedSessionId}
            onChange={(e) => { setSelectedSessionId(e.target.value); setEdits({}); }}
            style={{ width: "100%", maxWidth: 400, padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.navy, outline: "none" }}
          >
            <option value="">-- Choisir une session (Matière) --</option>
            {mySessions.map((s) => (
              <option key={s.id} value={s.id}>{s.formation} — {s.date_debut ? new Date(s.date_debut).toLocaleDateString("fr-FR") : "Date inconnue"}</option>
            ))}
          </select>
        </Card>

        {selectedSessionId ? (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}`, background: "#f8f9fc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0 }}>👥 Liste des inscrits — {selSession?.formation}</h2>
                <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0 0" }}>Feuille d'appel dynamique et notes.</p>
              </div>
              <div>
                <button
                  onClick={handleAddAppelDate}
                  style={{ padding: "10px 18px", background: C.accent, color: C.white, borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "0.2s" }}
                  onMouseOver={e => e.currentTarget.style.opacity = 0.9} onMouseOut={e => e.currentTarget.style.opacity = 1}
                >
                  📅 Créer séance ({Array.isArray(selSession?.jours_appel) ? selSession.jours_appel.length : (typeof selSession?.jours_appel === 'string' && selSession.jours_appel ? selSession.jours_appel.split(',').length : 0)})
                </button>
              </div>
            </div>
            {sessionApprenants.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Aucun apprenant n'est inscrit à cette formation.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.white, borderBottom: `1.5px solid ${C.border}` }}>
                    <th style={{ padding: "16px 28px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.textMuted, letterSpacing: "0.05em" }}>Apprenant</th>
                    <th style={{ padding: "16px 28px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.textMuted, letterSpacing: "0.05em", width: 140 }}>Présence (%)</th>
                    <th style={{ padding: "16px 28px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.textMuted, letterSpacing: "0.05em", width: 140 }}>Note Théorique</th>
                    <th style={{ padding: "16px 28px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.textMuted, letterSpacing: "0.05em", width: 140 }}>Note TP</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionApprenants.map((a) => {
                    const localEdits = edits[a.id] || {};
                    const theorie = localEdits.score_theorique !== undefined ? localEdits.score_theorique : (a.score_theorique || "");
                    const tp = localEdits.score_tp !== undefined ? localEdits.score_tp : (a.score_tp || "");
                    
                    const fullName = (a.prenom || a.nom) ? `${a.prenom || ''} ${a.nom || ''}`.trim() : `Apprenant #${a.apprenant_id || a.id}`;
                    const initials = (a.prenom || a.nom) ? `${a.prenom?.[0]||""}${a.nom?.[0]||""}`.toUpperCase() : "A#";
                    const email = a.email || "Donnée initiale (sans email)";

                    let aAbsences = localEdits.absences !== undefined ? localEdits.absences : [];
                    if (localEdits.absences === undefined) {
                      if (Array.isArray(a.absences)) aAbsences = a.absences;
                      else if (typeof a.absences === 'string') aAbsences = a.absences.split(',').filter(Boolean);
                    }
                    
                    let sJours = [];
                    if (Array.isArray(selSession.jours_appel)) sJours = selSession.jours_appel;
                    else if (typeof selSession.jours_appel === 'string') sJours = selSession.jours_appel.split(',').filter(Boolean);
                    
                    const tauxCalculated = sJours.length === 0 ? 100 : Math.max(0, Math.round(((sJours.length - aAbsences.length) / sJours.length) * 100));

                    const cellInputStyle = { width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${C.border}`, textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.navy, transition: "border-color 0.2s" };

                    return (
                      <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#fafcff"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "16px 28px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(30, 64, 175,0.15)", color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{fullName}</div>
                              <div style={{ fontSize: 12, color: C.textMuted }}>{email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "16px 28px", textAlign: "center" }}>
                          <button onClick={() => setAbsenceModalApprenant(a)} style={{ padding: "8px 12px", background: C.white, border: `1.5px solid ${aAbsences.length > 0 ? C.danger : C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: aAbsences.length > 0 ? C.danger : C.navy, cursor: "pointer", width: "100%" }}>
                            {aAbsences.length} absence(s)
                          </button>
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, fontWeight: 600 }}>Taux : {tauxCalculated}%</div>
                        </td>
                        <td style={{ padding: "16px 28px" }}>
                          <input type="number" min="0" max="100" value={theorie} onChange={(e) => handleEditChange(a.id, "score_theorique", e.target.value)} placeholder="/100" style={cellInputStyle} onFocus={e=>e.target.style.borderColor = C.accent} onBlur={e=>e.target.style.borderColor = C.border} />
                        </td>
                        <td style={{ padding: "16px 28px" }}>
                          <input type="number" min="0" max="100" value={tp} onChange={(e) => handleEditChange(a.id, "score_tp", e.target.value)} placeholder="/100" style={cellInputStyle} onFocus={e=>e.target.style.borderColor = C.accent} onBlur={e=>e.target.style.borderColor = C.border} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {sessionAnciens.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ padding: "20px 28px", borderTop: `2px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: "#fbf8f1" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: C.warning, margin: 0 }}>🗄️ Données initiales / Anciennes — {selSession?.formation}</h2>
                  <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0 0" }}>Ces apprenants proviennent de la base de données initiale sans appel journalier.</p>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.white, borderBottom: `1.5px solid ${C.border}` }}>
                      <th style={{ padding: "16px 28px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.textMuted, letterSpacing: "0.05em" }}>Apprenant (Ancien)</th>
                      <th style={{ padding: "16px 28px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.textMuted, letterSpacing: "0.05em", width: 140 }}>Présence Initiale (%)</th>
                      <th style={{ padding: "16px 28px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.textMuted, letterSpacing: "0.05em", width: 140 }}>Note Théorique</th>
                      <th style={{ padding: "16px 28px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.textMuted, letterSpacing: "0.05em", width: 140 }}>Note TP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionAnciens.map((a) => {
                      const localEdits = edits[a.id] || {};
                      const theorie = localEdits.score_theorique !== undefined ? localEdits.score_theorique : (a.score_theorique ?? "");
                      const tp = localEdits.score_tp !== undefined ? localEdits.score_tp : (a.score_tp ?? "");
                      const presence = localEdits.taux_presence !== undefined ? localEdits.taux_presence : (a.taux_presence ?? "");
                      
                      const fullName = (a.prenom || a.nom) ? `${a.prenom || ''} ${a.nom || ''}`.trim() : `Apprenant #${a.apprenant_id || a.id}`;
                      const initials = (a.prenom || a.nom) ? `${a.prenom?.[0]||""}${a.nom?.[0]||""}`.toUpperCase() : "A#";
                      const email = a.email || "Donnée initiale (sans email)";

                      const cellInputStyle = { width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${C.border}`, textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.warning, transition: "border-color 0.2s" };

                      return (
                        <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#fffcf5"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "16px 28px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fef3c7", color: C.warning, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: C.warning }}>{fullName}</div>
                                <div style={{ fontSize: 12, color: C.textMuted }}>{email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "16px 28px" }}>
                            <input type="number" min="0" max="100" value={presence} onChange={(e) => handleEditChange(a.id, "taux_presence", e.target.value)} placeholder="/100" style={cellInputStyle} onFocus={e=>e.target.style.borderColor = C.warning} onBlur={e=>e.target.style.borderColor = C.border} />
                          </td>
                          <td style={{ padding: "16px 28px" }}>
                            <input type="number" min="0" max="100" value={theorie} onChange={(e) => handleEditChange(a.id, "score_theorique", e.target.value)} placeholder="/100" style={cellInputStyle} onFocus={e=>e.target.style.borderColor = C.warning} onBlur={e=>e.target.style.borderColor = C.border} />
                          </td>
                          <td style={{ padding: "16px 28px" }}>
                            <input type="number" min="0" max="100" value={tp} onChange={(e) => handleEditChange(a.id, "score_tp", e.target.value)} placeholder="/100" style={cellInputStyle} onFocus={e=>e.target.style.borderColor = C.warning} onBlur={e=>e.target.style.borderColor = C.border} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : (
          <div style={{ padding: 60, textAlign: "center", color: C.textMuted, border: `2px dashed ${C.border}`, borderRadius: 24 }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Calendar size={40} color={C.accent} /></div>
            <div style={{ fontSize: 18, color: C.navy, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>Sélectionnez une session</div>
            <div>pour commencer à noter les apprenants et faire l'appel.</div>
          </div>
        )}

        {/* Modal for Absences */}
        {absenceModalApprenant && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) setAbsenceModalApprenant(null); }}>
            <div style={{ background: C.white, borderRadius: 20, width: 400, maxWidth: "90%", padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: C.navy, margin: 0 }}>Gérer l'appel</h3>
                <button onClick={() => setAbsenceModalApprenant(null)} style={{ background: "none", border: "none", fontSize: 20, color: C.textMuted, cursor: "pointer" }}>✕</button>
              </div>
              <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>
                Apprenant : <strong style={{ color: C.navy }}>{(absenceModalApprenant.prenom || absenceModalApprenant.nom) ? `${absenceModalApprenant.prenom || ''} ${absenceModalApprenant.nom || ''}`.trim() : `Apprenant #${absenceModalApprenant.apprenant_id || absenceModalApprenant.id}`}</strong>
              </p>

              {(() => {
                let sJours = [];
                if (Array.isArray(selSession?.jours_appel)) sJours = selSession.jours_appel;
                else if (typeof selSession?.jours_appel === 'string') sJours = selSession.jours_appel.split(',').filter(Boolean);

                const currentEdits = edits[absenceModalApprenant.id] || {};
                let currentAbsences = currentEdits.absences !== undefined ? currentEdits.absences : [];
                if (currentEdits.absences === undefined) {
                  if (Array.isArray(absenceModalApprenant.absences)) currentAbsences = absenceModalApprenant.absences;
                  else if (typeof absenceModalApprenant.absences === 'string') currentAbsences = absenceModalApprenant.absences.split(',').filter(Boolean);
                }

                if (sJours.length === 0) {
                  return <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: C.danger, background: "#ffebee", borderRadius: 8 }}>Aucune séance n'a été créée pour cette session. <br/>Cliquez sur "+ Créer séance" avant de faire l'appel.</div>;
                }

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "300px", overflowY: "auto" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>Cochez si l'apprenant était ABSENT</div>
                    {sJours.map(jour => {
                      const isAbsent = currentAbsences.includes(jour);
                      return (
                        <label key={jour} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${isAbsent ? C.danger : C.border}`, background: isAbsent ? "#fffafa" : C.white, cursor: "pointer", transition: "0.2s" }}>
                          <input type="checkbox" checked={isAbsent} onChange={e => {
                            let newAbsences = [...currentAbsences];
                            if (e.target.checked) newAbsences.push(jour);
                            else newAbsences = newAbsences.filter(d => d !== jour);
                            handleEditChange(absenceModalApprenant.id, "absences", newAbsences);
                          }} style={{ width: 18, height: 18, accentColor: C.danger, cursor: "pointer" }} />
                          <span style={{ fontSize: 14, fontWeight: isAbsent ? 700 : 500, color: isAbsent ? C.danger : C.navy }}>Séance du {new Date(jour).toLocaleDateString("fr-FR")}</span>
                        </label>
                      );
                    })}
                  </div>
                );
              })()}

              <button onClick={() => setAbsenceModalApprenant(null)} style={{ width: "100%", padding: "12px", background: C.navy, color: C.white, borderRadius: 10, border: "none", fontSize: 15, fontWeight: 700, marginTop: 24, cursor: "pointer" }}>
                Terminer
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── 6. TÉLÉCHARGER LISTE DES APPRENANTS ── */
  function TabApprenants() {
    // Le formateur ne voit que les apprenants affectés à l'une de ses sessions/formations
    const mySessionIds = new Set(mySessions.map(s => s.id));
    const mySessionFormations = new Set(mySessions.map(s => s.formation));
    const myApprenants = allApprenants.filter(a => 
      (a.session_id && mySessionIds.has(a.session_id)) || 
      (a.formation && mySessionFormations.has(a.formation))
    );

    function ApprenantRow({ a }) {
      const [tp, setTp] = useState(a.score_tp ?? "");
      const [th, setTh] = useState(a.score_theorique ?? "");
      const [pres, setPres] = useState(a.taux_presence ?? "");
      const [saving, setSaving] = useState(false);
      const isDirty = tp !== (a.score_tp ?? "") || th !== (a.score_theorique ?? "") || pres !== (a.taux_presence ?? "");

      const handleSave = async () => {
        setSaving(true);
        try {
          // Normalement on envoie les donnees au backend
          await api.put(`/apprenants/${a.id}`, { score_tp: tp, score_theorique: th, taux_presence: pres });
          a.score_tp = tp; a.score_theorique = th; a.taux_presence = pres;
        } catch (e) {
          console.error(e);
        }
        setSaving(false);
      };

      return (
        <tr style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = C.bg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: C.navy }}>
            {(a.prenom || a.nom) ? `${a.prenom || ''} ${a.nom || ''}`.trim() : `Apprenant #${a.apprenant_id || a.id}`}
          </td>
          <td style={{ padding: "14px 16px", fontSize: 13 }}><Badge color={C.info}>{a.formation}</Badge></td>
          <td style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="number" max="100" style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} value={tp} onChange={e => setTp(e.target.value)} placeholder="%" /> <span style={{fontSize:12, color:C.textMuted}}>%</span>
            </div>
          </td>
          <td style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="number" max="100" style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} value={th} onChange={e => setTh(e.target.value)} placeholder="%" /> <span style={{fontSize:12, color:C.textMuted}}>%</span>
            </div>
          </td>
          <td style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="number" max="100" style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} value={pres} onChange={e => setPres(e.target.value)} placeholder="%" /> <span style={{fontSize:12, color:C.textMuted}}>%</span>
            </div>
          </td>
          <td style={{ padding: "14px 16px", textAlign: "right" }}>
            <button onClick={handleSave} disabled={!isDirty || saving} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: isDirty ? C.accent : `${C.border}80`, color: isDirty ? "#fff" : C.textMuted, cursor: isDirty ? "pointer" : "default", fontWeight: 600, fontSize: 12, transition: "0.2s" }}>
              {saving ? "..." : "Enregistrer"}
            </button>
          </td>
        </tr>
      );
    }

    return (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: C.navy, margin: 0 }}>
            Évaluation des Apprenants ({myApprenants.length})
          </h2>
          <button
            onClick={downloadCSV}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", background: C.navy, color: C.white, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 }}
          >
            ⬇️ Exporter Apprenants
          </button>
          <a ref={downloadRef} style={{ display: "none" }}>download</a>
        </div>

        {myApprenants.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Apprenant", "Formation", "TP (%)", "Théorie (%)", "Présence (%)", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: h === "Action" ? "right" : "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: C.textMuted, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myApprenants.map((a, i) => <ApprenantRow key={a.id || i} a={a} />)}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.textMuted }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>👥</span>
            <p>Aucun apprenant inscrit à vos formations pour le moment.</p>
          </div>
        )}
      </Card>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <TabDashboard />;
      case "compte": return <TabCompte />;
      case "historique": return <TabHistorique />;
      case "cours": return <TabCours />;
      case "suivi": return <TabSuivi />;
      case "apprenants": return <TabApprenants />;
      default: return <TabDashboard />;
    }
  };

  return (
    <>
      {/* ── Global animation styles ── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tab-content {
          animation: fadeSlideIn 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .sidebar-nav-btn:hover {
          background: rgba(30, 64, 175,0.15) !important;
          color: rgba(255,255,255,0.95) !important;
        }
      `}</style>

    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Sidebar ── */}
      <div style={{ width: sidebarOpen ? 260 : 0, background: C.navy, color: "white", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflow: "hidden", transition: "width 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
        {/* Logo */}
        <div style={{ padding: "28px 24px", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#ffffff", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          Waialys<span style={{ color: "#ffffff" }}> Formation</span>
        </div>

        {/* Nav */}
        <div style={{ padding: "20px 14px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, paddingLeft: 8 }}>
            Espace Formateur
          </div>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: "100%", textAlign: "left", padding: "11px 16px", margin: "3px 0",
                background: activeTab === item.id ? "rgba(255,255,255,0.12)" : "transparent",
                borderLeft: activeTab === item.id ? `3px solid #ffffff` : "3px solid transparent",
                color: activeTab === item.id ? "#ffffff" : "rgba(255,255,255,0.7)",
                border: "none", borderRadius: 8, cursor: "pointer",
                fontSize: 14, fontWeight: activeTab === item.id ? 700 : 400,
                display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s"
              }}
            >
              <span style={{ fontSize: 17 }}>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        {/* User info bottom */}
        <div style={{ padding: "16px 18px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(30, 64, 175,0.2)", color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
            {ini}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.prenom} {me.nom}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.email}</div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <header style={{ height: 72, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px 0 20px", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Toggle sidebar button */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              title={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
              style={{ width: 38, height: 38, borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, flexShrink: 0, transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = C.white}
            >
              <span style={{ display: "block", width: 16, height: 2, background: C.navy, borderRadius: 2, transition: "all 0.2s", transform: sidebarOpen ? "none" : "rotate(45deg) translate(3px,3px)" }} />
              <span style={{ display: "block", width: 16, height: 2, background: C.navy, borderRadius: 2, transition: "all 0.2s", opacity: sidebarOpen ? 1 : 0 }} />
              <span style={{ display: "block", width: 16, height: 2, background: C.navy, borderRadius: 2, transition: "all 0.2s", transform: sidebarOpen ? "none" : "rotate(-45deg) translate(3px,-3px)" }} />
            </button>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>
              {NAV.find(n => n.id === activeTab)?.label}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{me.prenom} {me.nom}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>Formateur Expert</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.navy, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>
              {ini}
            </div>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e4e8f0", background: "transparent", color: "#c62828", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              onMouseOver={e => e.currentTarget.style.background = "#fce4ec"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: 40, flex: 1, overflowY: "auto" }}>
          <div key={activeTab} className="tab-content">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
