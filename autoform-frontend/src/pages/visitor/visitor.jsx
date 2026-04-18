import { useState, useEffect } from "react";
import api from "../../api";
import { MapPin, Phone, X, Clock, Tag, MonitorPlay, MessageCircle, Download, Mail } from "lucide-react";

// SVGs for social icons to avoid missing imports in older lucide versions
const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const C = {
  navy: "#0f1c3f",
  navyLight: "#1a2d5a",
  accent: "#1e40af",
  bg: "#f8f9fd",
  white: "#ffffff",
  text: "#1a2340",
  textMuted: "#6b7280",
};

export default function VisitorPortal({ onLoginClick, onAdminLogin }) {
  const [formations, setFormations] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    age: '', sexe: 'Homme', profil_candidat: 'Étudiant',
    formation: '', niveau_tia: '', mode_formation: 'Continue', mot_de_passe: '',
    session_id: ''
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFormationDetails, setSelectedFormationDetails] = useState(null);



  useEffect(() => {
    // Récupérer uniquement les formations "Active"
    api.get('/formations')
      .then(res => {
        const data = res.data.data || res.data || [];
        setFormations(data.filter(f => f.statut === 'Active'));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Récupérer toutes les sessions disponibles
    api.get('/sessions')
      .then(res => {
        const data = res.data.data || res.data || [];
        // Garder uniquement les sessions Planifiées ou En cours avec des places disponibles
        setAllSessions(data.filter(s => s.statut !== 'Annulée' && s.statut !== 'Terminée'));
      })
      .catch(() => {});
  }, []);

  // Quand la formation change, filtrer les sessions correspondantes
  const handleFormationChange = (e) => {
    const selectedFormation = e.target.value;
    setForm({ ...form, formation: selectedFormation, session_id: '' });
    const sessions = allSessions.filter(s => s.formation === selectedFormation);
    setFilteredSessions(sessions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!form.nom || !form.prenom || !form.email || !form.formation) {
      setError("Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email, Formation).");
      return;
    }
    if (!form.mot_de_passe || form.mot_de_passe.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    
    const isTia = form.formation.toLowerCase().includes('tia');
    if (isTia && !form.niveau_tia) {
      setError("Veuillez sélectionner le niveau de formation pour TIA Portal.");
      return;
    }
    
    const finalFormation = (isTia && form.niveau_tia) 
      ? `${form.formation} - Niveau ${form.niveau_tia}`
      : form.formation;

    api.post('/apprenants', {
      ...form,
      formation: finalFormation,
      age: form.age ? parseInt(form.age) : null,
      session_id: form.session_id ? parseInt(form.session_id) : null,
      date_inscription: new Date().toISOString().split('T')[0],
      statut: 'En cours',
      paiement: 'En attente'
    })
      .then(() => {
        setSent(true);
        setTimeout(() => setSent(false), 6000);
        setForm({ nom: '', prenom: '', email: '', telephone: '', age: '', sexe: 'Homme', profil_candidat: 'Étudiant', formation: '', niveau_tia: '', mode_formation: 'Weekend', mot_de_passe: '', session_id: '' });
        setFilteredSessions([]);
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || "Erreur lors de l'inscription");
      });
  };

  return (
    <div style={{ minHeight: '100vh', background: C.white, fontFamily: "'DM Sans', sans-serif" }}>
      {/* HEADER PUBLIC */}
      <header style={{ padding: "12px 60px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "fixed", width: "100%", top: 0, background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(16px)", zIndex: 100, boxSizing: "border-box", borderBottom: "1px solid rgba(255, 255, 255, 0.3)", boxShadow: "0 4px 30px rgba(15, 28, 63, 0.05)", transition: "all 0.3s ease" }}>
        <a href="#hero" style={{ textDecoration: 'none', transition: 'transform 0.3s', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: C.navy }}>
            Waialys<span style={{ color: C.accent }}> Formation</span>
          </span>
        </a>
        <div style={{ display: "flex", gap: 36, fontSize: 14, fontWeight: 600, color: C.navy }}>
          <a href="#hero" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = C.accent} onMouseOut={e => e.target.style.color = 'inherit'}>Accueil</a>
          <a href="#catalogue" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = C.accent} onMouseOut={e => e.target.style.color = 'inherit'}>Nos Formations</a>
          <a href="#footer" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = C.accent} onMouseOut={e => e.target.style.color = 'inherit'}>Contact</a>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <button
            onClick={onLoginClick}
            style={{ background: 'transparent', color: C.navy, border: `1.5px solid ${C.navy}`, padding: "8px 24px", borderRadius: 30, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={e => { e.target.style.background = C.navy; e.target.style.color = 'white'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = C.navy; e.target.style.transform = 'translateY(0)'; }}
          >
            Se connecter
          </button>
          <a href="#contact" style={{ background: C.white, color: C.navy, padding: "8px 24px", borderRadius: 30, border: `1.5px solid ${C.navy}`, textDecoration: 'none', fontWeight: 600, fontSize: 13, transition: 'all 0.2s' }}
             onMouseOver={e => { e.target.style.background = C.navy; e.target.style.color = C.white; e.target.style.transform = 'translateY(-1px)'; }}
             onMouseOut={e => { e.target.style.background = C.white; e.target.style.color = C.navy; e.target.style.transform = 'translateY(0)'; }}
          >
            S'inscrire
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="hero" style={{ 
        paddingTop: 180, 
        paddingBottom: 160, 
        paddingLeft: "10%", 
        paddingRight: "10%", 
        backgroundImage: `linear-gradient(to right, rgba(15, 28, 63, 0.95) 0%, rgba(15, 28, 63, 0.2) 100%), url('/hero-bg.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "flex-start",
        position: "relative"
      }}>
        <div style={{ maxWidth: 750, zIndex: 1 }}>
          <div style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.15em", color: "#ffffff", fontWeight: 700, marginBottom: 20 }}>
            Accélérez votre carrière technique
          </div>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 62, fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px 0", letterSpacing: "-0.02em", textShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
            L'Excellence en Ingénierie & Automatisme Industriel
          </h1>
          <p style={{ fontSize: 20, color: "white", marginBottom: 40, lineHeight: 1.5, fontWeight: 500, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            Des formations certifiantes dispensées par des experts de l'industrie. Apprenez sur des équipements réels et maîtrisez les technologies de demain.
          </p>
          <a href="#catalogue" style={{ display: "inline-block", background: C.white, color: C.navy, padding: "18px 40px", borderRadius: 6, textDecoration: 'none', fontWeight: 800, fontSize: 16, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)", transition: "all 0.2s ease" }}
             onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.25)"; }}
             onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15)"; }}>
            Découvrir le catalogue
          </a>
        </div>
      </section>

      {/* CATLALOGUE */}
      <section id="catalogue" style={{ padding: "80px 60px", background: C.bg }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: C.navy, margin: "0 0 12px 0" }}>Nos Formations Phares</h2>
          <p style={{ color: C.textMuted, maxWidth: 600, margin: "0 auto" }}>Découvrez nos programmes conçus pour répondre aux plus hautes exigences techniques du marché de l'industrie 4.0.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Chargement du catalogue...</div>
        ) : formations.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 30, maxWidth: 1200, margin: "0 auto" }}>
            {formations.map(f => (
              <div key={f.id} style={{ background: C.white, borderRadius: 16, overflow: 'hidden', boxShadow: "0 4px 20px rgba(15,28,63,0.05)", border: `1px solid ${C.border}`, transition: "transform 0.3s" }}>
                <div style={{ height: 160, width: '100%', overflow: 'hidden' }}>
                  <img
                    src={f.titre.toLowerCase().includes('tia portal') ? '/Tia.png' : f.titre.toLowerCase().includes('scada') ? '/scada.png' : f.titre.toLowerCase().includes('eplan') ? '/eplan.png' : f.titre.toLowerCase().includes('industrie') ? '/industtrie4.0.png' : f.titre.toLowerCase().includes('solidworks') ? '/solidworks.png' : `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80&sig=${f.id}`}
                    alt={f.titre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    onMouseOver={e => e.target.style.transform = 'scale(1.08)'}
                    onMouseOut={e => e.target.style.transform = 'scale(1)'}
                  />
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{f.duree} • {f.prix}</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.navy, margin: "0 0 12px 0" }}>{f.titre}</h3>
                  <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
                    {f.description ? (f.description.length > 100 ? f.description.substring(0, 100) + '...' : f.description) : 'Rejoignez ce programme intensif pour maîtriser tous les aspects techniques.'}
                  </p>
                  <button 
                    onClick={() => setSelectedFormationDetails(f)} 
                    style={{ display: 'block', textAlign: 'center', width: '100%', padding: '11px 0', background: '#ffffff', color: C.navy, border: `1.5px solid ${C.navy}`, borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s' }}
                    onMouseOver={e => { e.target.style.background = C.navy; e.target.style.color = '#ffffff'; }}
                    onMouseOut={e => { e.target.style.background = '#ffffff'; e.target.style.color = C.navy; }}
                  >
                    En savoir plus
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: C.textMuted }}>Aucune session disponible pour le moment.</div>
        )}
      </section>

      {/* INSCRIPTION */}
      <section id="contact" style={{ padding: "80px 60px", background: C.white }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: C.navy, margin: "0 0 12px 0" }}>S'inscrire à une Formation</h2>
          <p style={{ color: C.textMuted, maxWidth: 600, margin: "0 auto" }}>Soumettez votre candidature pour rejoindre l'une de nos formations certifiantes.</p>
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          {/* COLONNE INSCRIPTION */}
          <div style={{ background: C.white, borderRadius: 20, padding: 40, boxShadow: "0 10px 40px rgba(15,28,63,0.08)", border: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: C.navy, margin: "0 0 8px 0" }}>Formulaire d'Inscription</h3>
            <p style={{ color: C.textMuted, marginBottom: 30, fontSize: 14 }}>Soumettez votre candidature pour une formation.</p>

          {sent ? (
            <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: 20, borderRadius: 8, textAlign: 'center', fontWeight: 600 }}>
              ✅ Inscription réussie ! Vous pouvez maintenant vous connecter avec votre email et mot de passe.
              <div style={{ marginTop: 12 }}>
                <button onClick={onLoginClick} style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Se connecter →</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div style={{ background: '#fce4ec', color: '#c62828', padding: '10px', borderRadius: 8, fontSize: 13, textAlign: 'center' }}>{error}</div>}

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Nom *</label>
                  <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none' }} placeholder="Nom" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Prénom *</label>
                  <input required value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none' }} placeholder="Prénom" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none' }} placeholder="votre@email.com" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Téléphone</label>
                  <input type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value.replace(/\D/g, '').slice(0, 8) })} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none' }} placeholder="XX XXX XXX" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Sexe</label>
                  <select value={form.sexe} onChange={e => setForm({ ...form, sexe: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none', background: '#fff' }}>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Âge</label>
                  <input type="number" required value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} min="19" max="65" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none' }} placeholder="Ex: 24 (entre 19 et 65)" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Profil</label>
                  <select value={form.profil_candidat} onChange={e => setForm({ ...form, profil_candidat: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none', background: '#fff' }}>
                    <option value="Étudiant">Étudiant</option>
                    <option value="Employé(e)">Employé(e)</option>
                    <option value="Pris en charge">Pris en charge</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Mot de passe *</label>
                  <input
                    required
                    type="password"
                    value={form.mot_de_passe}
                    onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none' }}
                    placeholder="Min. 6 caractères"
                    minLength={6}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Formation souhaitée *</label>
                  <select required value={form.formation} onChange={handleFormationChange} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none', background: '#fff' }}>
                    <option value="" disabled>Sélectionnez une formation</option>
                    {formations.map(f => <option key={f.id} value={f.titre}>{f.titre}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Mode</label>
                  <select value={form.mode_formation} onChange={e => setForm({ ...form, mode_formation: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none', background: '#fff' }}>
                    <option value="Weekend">Weekend</option>
                    <option value="1 par semaine">1 par semaine</option>
                    <option value="Continue">Continue</option>
                  </select>
                </div>
              </div>

              {form.formation.toLowerCase().includes('tia') && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Niveau TIA Portal *</label>
                  <select required value={form.niveau_tia} onChange={e => setForm({ ...form, niveau_tia: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: 'none', background: '#fff' }}>
                    <option value="" disabled>Sélectionnez votre niveau</option>
                    <option value="Basique">Basique</option>
                    <option value="Avancé">Avancé</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              )}

              {/* SESSION selon la formation choisie */}
              {form.formation && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
                    Session disponible
                  </label>
                  {filteredSessions.length > 0 ? (
                    <select
                      value={form.session_id}
                      onChange={e => setForm({ ...form, session_id: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.accent}`, fontFamily: "inherit", fontSize: 14, outline: 'none', background: '#fff' }}
                    >
                      <option value="">-- Aucune session sélectionnée --</option>
                      {filteredSessions.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.date_debut ? new Date(s.date_debut).toLocaleDateString('fr-FR') : 'Date TBD'}
                          {s.date_fin ? ` → ${new Date(s.date_fin).toLocaleDateString('fr-FR')}` : ''}
                          {s.formateur ? ` — ${s.formateur}` : ''}
                          {` ${ (s.places || 10) - (s.inscrits || 0)} place(s) restante(s))`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fff8e1', border: '1px solid #fde68a', color: '#b45309', fontSize: 13, fontWeight: 600 }}>
                      ⚠️ Aucune session planifiée pour cette formation pour le moment.
                    </div>
                  )}
                </div>
              )}

              <button type="submit" style={{ background: '#ffffff', color: C.navy, padding: "14px", border: `1.5px solid ${C.navy}`, borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 10, transition: 'all 0.2s' }} onMouseOver={e => { e.target.style.background = C.navy; e.target.style.color = '#ffffff'; }} onMouseOut={e => { e.target.style.background = '#ffffff'; e.target.style.color = C.navy; }}>Valider mon inscription</button>
            </form>
          )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer" style={{ background: C.navy, color: "rgba(255,255,255,0.7)", padding: "60px 40px 30px", fontSize: 14 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 40, marginBottom: 40 }}>
          
          {/* Brand */}
          <div style={{ maxWidth: 400 }}>
            <div style={{ marginBottom: 16 }}>
              <img src="/logo.png" alt="Waialys Formation" style={{ height: 90, objectFit: 'contain', filter: 'brightness(0) invert(1)', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
            </div>
            <p style={{ lineHeight: 1.7, marginBottom: 20 }}>
              Bureau de formation continue<br/>
              agréé par l'État tunisien<br/>
              et le ministère de la formation<br/>
              professionnelle et de l'emploi 
            </p>
          </div>

          {/* Contact */}
          <div style={{ minWidth: 250 }}>
            <h4 style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 24, fontFamily: "'Cormorant Garamond', serif" }}>Contactez-nous</h4>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
              <MapPin size={20} style={{ color: "#ffffff", flexShrink: 0, marginTop: 2 }} />
              <span style={{ lineHeight: 1.5 }}>
            2éme étage-B20, Imm Planet FOOD, <br />
            Av. de Yasser Arafat, Sousse 4054
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
              <Phone size={20} style={{ color: "#ffffff", flexShrink: 0 }} />
              <span>Tel : +216 26 411 511</span>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
              <Mail size={20} style={{ color: "#ffffff", flexShrink: 0 }} />
              <a href="mailto:waialyscontact@gmail.com" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#ffffff"} onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}>waialyscontact@gmail.com</a>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <a href="https://www.linkedin.com/company/waialys-formation/posts/?feedView=all" target="_blank" rel="noreferrer" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "all 0.2s", textDecoration: "none" }} onMouseOver={e => e.currentTarget.style.background=C.accent} onMouseOut={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
                <LinkedinIcon />
              </a>
              <a href="https://www.facebook.com/WaialysFormation" target="_blank" rel="noreferrer" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "all 0.2s", textDecoration: "none" }} onMouseOver={e => e.currentTarget.style.background=C.accent} onMouseOut={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
                <FacebookIcon />
              </a>
              <a href="https://www.instagram.com/waialys_formation/" target="_blank" rel="noreferrer" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "all 0.2s", textDecoration: "none" }} onMouseOver={e => e.currentTarget.style.background=C.accent} onMouseOut={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
                <InstagramIcon />
              </a>
            </div>
          </div>

          {/* Map */}
          <div style={{ flex: 1, minWidth: 250, maxWidth: 300, height: 160, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <iframe 
              src="https://maps.google.com/maps?q=Waialys+formation,+Sousse&t=&z=15&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Waialys Formation Location"
            ></iframe>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 20, fontSize: 13, maxWidth: 1200, margin: "0 auto" }}>
          <div></div>
          <p style={{ margin: 0, textAlign: "center" }}>© 2026 Waialys. Tous droits réservés.</p>
          <div style={{ textAlign: "right" }}>
            <button onClick={onAdminLogin} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, padding: 0 }}>Espace Administrateur</button>
          </div>
        </div>
      </footer>

      {/* MODAL DETAIL FORMATION */}
      {/* MODAL DETAIL FORMATION */}
      {selectedFormationDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 28, 63, 0.4)', backdropFilter: 'blur(8px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box', overflowY: 'auto' }}>
          
          <div style={{ background: '#fdfcf8', width: '100%', maxWidth: 700, borderRadius: 16, padding: '50px 60px', position: 'relative', boxShadow: '0 25px 80px rgba(0,0,0,0.15)', margin: 'auto', border: '1px solid rgba(0,0,0,0.05)' }}>
            
            {/* Bouton fermer premium */}
            <button onClick={() => setSelectedFormationDetails(null)} style={{ position: 'absolute', top: 24, right: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} onMouseOver={e=>{e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.borderColor='#d1d5db'}} onMouseOut={e=>{e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.borderColor='#e5e7eb'}}>
              <X size={20} color="#6b7280" />
            </button>
            
            {/* Badge */}
            <div style={{ display: 'inline-block', background: 'rgba(30, 64, 175, 0.15)', color: C.accent, padding: '6px 14px', borderRadius: 30, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>
              Formation Certifiante
            </div>

            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 700, color: '#000', margin: '0 0 20px 0', lineHeight: 1.1, paddingRight: 20 }}>
              {selectedFormationDetails.titre}
            </h2>
            
            <p style={{ fontSize: 18, color: '#4b5563', lineHeight: 1.6, marginBottom: 40, fontWeight: 400 }}>
              {selectedFormationDetails.description || "Débloquez la puissance de l'ingénierie et de l'automatisme industriel et gagnez une expérience pratique inestimable en quelques semaines. C'est l'une des compétences les plus recherchées sur le marché actuel."}
            </p>

            {selectedFormationDetails.titre.toLowerCase().includes('tia') && (
              <div style={{ background: '#eff6ff', color: '#1e3a8a', padding: '16px 20px', borderRadius: 12, borderLeft: '4px solid #1e40af', marginBottom: 40, fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 800 }}>À noter :</span> Ce programme TIA Portal est disponible en 3 niveaux : <strong>Basique, Avancé et Expert</strong>. Vous pourrez faire votre choix dans le formulaire d'inscription !
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, marginBottom: 48, flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  handleFormationChange({ target: { value: selectedFormationDetails.titre } });
                  setSelectedFormationDetails(null);
                  setTimeout(() => document.getElementById('contact') && document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }), 100);
                }} 
                style={{ background: '#ffffff', color: C.navy, padding: '0 32px', height: 56, borderRadius: 8, border: `1.5px solid ${C.navy}`, fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = C.navy; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Discutons-en <MessageCircle size={20} />
              </button>
              
              <button 
                onClick={() => {
                  setSelectedFormationDetails(null);
                  setTimeout(() => document.getElementById('contact') && document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }), 100);
                }} 
                style={{ background: '#ffffff', color: C.navy, padding: '0 32px', height: 56, borderRadius: 8, border: `1.5px solid ${C.navy}`, fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}
                 onMouseOver={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'translateY(-2px)'}}
                 onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = C.navy; e.currentTarget.style.transform = 'translateY(0)'}}>
                Télécharger la brochure <Download size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={22} color="#000" strokeWidth={2.5} />
                </div>
                <div style={{ color: '#000', fontSize: 17, fontWeight: 700 }}>Durée : {selectedFormationDetails.duree}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MonitorPlay size={22} color="#000" strokeWidth={2.5} />
                </div>
                <div style={{ color: '#000', fontSize: 17, fontWeight: 700 }}>Rythme : 6h / jour</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MonitorPlay size={22} color="#000" strokeWidth={2.5} />
                </div>
                <div style={{ color: '#000', fontSize: 17, fontWeight: 700 }}>En personne ou en ligne</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
