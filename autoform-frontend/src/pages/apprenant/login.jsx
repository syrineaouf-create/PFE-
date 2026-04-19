import { useState } from "react";
import api from "../../api";
import { Eye, EyeOff, Home } from "lucide-react";

const C = {
  navy:       "#0f1c3f",
  navyLight:  "#1a2d5a",
  accent:     "#1e40af",
  accentSoft: "#f5edd8",
  bg:         "#f4f6fb",
  white:      "#ffffff",
  text:       "#1a2340",
  textMuted:  "#8892a4",
  border:     "#e4e8f0",
  danger:     "#c62828",
  warning:    "#b45309",
  warningBg:  "#fff8e1",
};

export default function LoginPage({ onLogin, onBack, onGoToRegister, forcedRole }) {
  const [role, setRole]       = useState(forcedRole || "apprenant"); // 'apprenant' | 'formateur'
  const [email, setEmail]     = useState("");
  const [mdp, setMdp]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [pending, setPending] = useState(false); // compte en attente
  const [showPwd, setShowPwd] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotMsg, setForgotMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isForgotMode) {
      handleForgot();
      return;
    }

    setError(null);
    setPending(false);
    if (!email || !mdp) {
      setError("Veuillez saisir votre email et votre mot de passe.");
      return;
    }
    setLoading(true);
    try {
      const endpoint = role === "apprenant"
        ? "/apprenants/login"
        : role === "admin"
          ? "/admins/login"
          : "/formateurs/login";

      const res = await api.post(endpoint, { email: email.trim(), mot_de_passe: mdp });
      const userData = res.data?.data || res.data;
      
      // Injecter le token dans le userData stocké pour l'intercepteur API
      if (res.data?.token) {
        userData.token = res.data.token;
      }

      if (userData) {
        // Nettoyer les éventuelles autres sessions en cours pour éviter les conflits de rôles
        localStorage.removeItem('apprenant_session');
        localStorage.removeItem('admin_session');
        localStorage.removeItem('formateur_session');

        localStorage.setItem(
          role === "apprenant" ? "apprenant_session" : role === "admin" ? "admin_session" : "formateur_session",
          JSON.stringify(userData)
        );
        onLogin(userData, role);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setPending(true);
      } else if (status === 401) {
        setError("Email ou mot de passe incorrect.");
      } else {
        setError(err.response?.data?.message || "Erreur de connexion, veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError(null);
    setForgotMsg(null);
    if (!email) {
      setError("Veuillez saisir votre email.");
      return;
    }
    setLoading(true);
    try {
      const endpoint = role === "apprenant"
        ? "/apprenants/forgot-password"
        : role === "admin"
          ? "/admins/forgot-password"
          : "/formateurs/forgot-password";

      const res = await api.post(endpoint, { email: email.trim() });
      setForgotMsg(res.data?.message || "Un e-mail de réinitialisation a été envoyé.");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-card { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1); }
        .login-input { box-shadow: none; }
        .login-input:focus { border-color: #1e40af !important; box-shadow: 0 0 0 3px rgba(30, 64, 175,0.15) !important; outline: none; }
        .login-btn-main { transition: all 0.2s !important; }
        .login-btn-main:hover:not(:disabled) { background: #1a2d5a !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(15,28,63,0.25) !important; }
      `}</style>

      <div style={{
        minHeight: "100vh", width: "100%",
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 55%, #1e3a6e 100%)`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative", overflow: "hidden"
      }}>
        {/* Decorative circles */}
        {[0,1,2].map(i => (
          <div key={i} style={{
            position: "absolute",
            top:    ["-80px", "auto", "auto"][i],
            bottom: ["auto", "-60px", "auto"][i],
            left:   ["-80px", "auto", "auto"][i],
            right:  ["auto", "auto", "-100px"][i],
            width:  [300, 200, 400][i], height: [300, 200, 400][i],
            borderRadius: "50%",
            border: "1px solid rgba(30, 64, 175,0.10)",
            pointerEvents: "none"
          }} />
        ))}

        {/* Bouton retour au site — discret en haut à gauche */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              position: "absolute", top: 24, left: 24,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10, padding: "9px 16px",
              color: "rgba(255,255,255,0.7)", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
              transition: "all 0.2s", zIndex: 10,
            }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#fff"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            <Home size={15} /> Home
          </button>
        )}

        {/* Logo */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: C.accent }}>
            Waialys<span style={{ color: "#fff" }}> Formation</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Portail Numérique
          </div>
        </div>

        {/* Card */}
        <div className="login-card" style={{
          background: C.white, borderRadius: 24,
          padding: "40px 44px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
          width: "100%", maxWidth: 460,
          boxSizing: "border-box", margin: "0 16px", position: "relative", zIndex: 2
        }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 26, fontWeight: 700, color: C.navy,
            margin: "0 0 6px 0", textAlign: "center"
          }}>
            {isForgotMode ? "Mot de passe oublié" : "Connexion"}
          </h1>
          <p style={{ fontSize: 13, color: C.textMuted, textAlign: "center", margin: "0 0 24px 0" }}>
            {isForgotMode ? "Entrez votre email pour recevoir un lien de réinitialisation" : "Accédez à votre espace personnel"}
          </p>

          {/* Messages info/erreur */}
          {forgotMsg && (
            <div style={{
              background: "#e8f5e9", color: "#2e7d32",
              padding: "12px 16px", borderRadius: 10,
              fontSize: 13, marginBottom: 20,
              border: "1px solid #c8e6c9",
              display: "flex", alignItems: "center", gap: 8
            }}>
              ✅ {forgotMsg}
            </div>
          )}

          {/* Pending warning */}
          {pending && (
            <div style={{
              background: C.warningBg, color: C.warning,
              padding: "14px 16px", borderRadius: 10,
              fontSize: 13, marginBottom: 20,
              border: "1px solid #fde68a",
              display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.5
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⏳</span>
              <div>
                <strong>Compte en attente de validation</strong><br />
                Votre inscription a bien été reçue. Un administrateur doit activer votre compte.
                Vous serez notifié(e) par email une fois l'accès accordé.
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "#fce4ec", color: C.danger,
              padding: "12px 16px", borderRadius: 10,
              fontSize: 13, marginBottom: 20,
              border: "1px solid #f8bbd0",
              display: "flex", alignItems: "center", gap: 8
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Email
              </label>
              <input
                id="login-email"
                className="login-input"
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); setPending(false); }}
                placeholder="votre@email.com"
                autoComplete="email"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "13px 16px", borderRadius: 10,
                  border: `1.5px solid ${C.border}`,
                  fontFamily: "inherit", fontSize: 14,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  color: C.text, outline: "none",
                  background: C.white
                }}
              />
            </div>

            {!isForgotMode && (
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Mot de passe
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-password"
                    className="login-input"
                    type={showPwd ? "text" : "password"}
                    required={!isForgotMode}
                    value={mdp}
                    onChange={e => { setMdp(e.target.value); setError(null); setPending(false); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "13px 46px 13px 16px", borderRadius: 10,
                      border: `1.5px solid ${C.border}`,
                      fontFamily: "inherit", fontSize: 14,
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      color: C.text, outline: "none",
                      background: C.white
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      padding: 4, display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    aria-label="Afficher le mot de passe"
                  >
                    {showPwd ? <EyeOff size={18} color="#8892a4" /> : <Eye size={18} color="#8892a4" />}
                  </button>
                </div>
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotMode(true)}
                    style={{ background: 'none', border: 'none', color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
            )}

            {!forcedRole && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: C.navy, fontWeight: 600, marginTop: 4, marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={role === "formateur"}
                  onChange={(e) => {
                    setRole(e.target.checked ? "formateur" : "apprenant");
                    setError(null);
                    setPending(false);
                  }}
                  style={{ width: 16, height: 16, accentColor: C.navy, cursor: "pointer" }}
                />
                Je suis un formateur
              </label>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="login-btn-main"
              style={{
                background: C.navy, color: "#fff", border: "none",
                borderRadius: 10, padding: "15px",
                fontFamily: "inherit", fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, marginTop: 4,
                boxShadow: "0 4px 16px rgba(15,28,63,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  {isForgotMode ? "Envoi..." : "Connexion…"}
                </>
              ) : (
                isForgotMode ? "Envoyer le lien" : "Se connecter"
              )}
            </button>

            {isForgotMode && (
              <button
                type="button"
                onClick={() => { setIsForgotMode(false); setError(null); setForgotMsg(null); }}
                style={{
                  background: "transparent", color: C.navy, border: "none",
                  padding: "10px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", marginTop: "-8px", fontFamily: "inherit"
                }}
              >
                ← Retour à la connexion
              </button>
            )}
          </form>

          {/* Signup section only for apprenant */}
          {role === "apprenant" && !isForgotMode && (
            <>
              {/* Divider + Signup */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 18px" }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 12, color: C.textMuted }}>Pas encore inscrit ?</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              <button
                onClick={onGoToRegister || onBack}
                style={{
                  width: "100%", padding: "12px",
                  border: `2px solid ${C.border}`,
                  borderRadius: 10, background: "transparent",
                  color: C.navy, fontFamily: "inherit",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s"
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentSoft; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "transparent"; }}
              >
                Créer mon compte →
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: 22, fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", zIndex: 1 }}>
          © 2026 Waialys Formation. Tous droits réservés.
        </div>
      </div>
    </>
  );
}
