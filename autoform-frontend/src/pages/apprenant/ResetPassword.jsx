import { useState } from "react";
import api from "../../api";
import { Eye, EyeOff } from "lucide-react";

const C = {
  navy:       "#0f1c3f",
  navyLight:  "#1a2d5a",
  accent:     "#1e40af",
  bg:         "#f4f6fb",
  white:      "#ffffff",
  text:       "#1a2340",
  textMuted:  "#8892a4",
  border:     "#e4e8f0",
  danger:     "#c62828",
};

export default function ResetPasswordPage({ resetToken, role, onBackToLogin }) {
  const [mdp, setMdp] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!mdp || mdp.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === "apprenant"
        ? "/apprenants/reset-password"
        : role === "admin"
          ? "/admins/reset-password"
          : "/formateurs/reset-password";

      const res = await api.post(endpoint, { token: resetToken, nouveau_mdp: mdp });
      setSuccess(true);
      setTimeout(() => {
        // Redirigeons vers le login après succès, s'ils ne cliquent pas sur le bouton manuellement
        onBackToLogin();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Lien de réinitialisation invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 55%, #1e3a6e 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reset-btn { transition: all 0.2s; }
        .reset-btn:hover:not(:disabled) { background: #1a2d5a !important; transform: translateY(-1px); }
      `}</style>
      
      <div style={{
        background: C.white, borderRadius: 24, padding: "40px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)", width: "100%", maxWidth: 460,
        boxSizing: "border-box", margin: "0 16px", animation: "fadeUp 0.4s cubic-bezier(0.22,1,0.36,1)"
      }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26, fontWeight: 700, color: C.navy,
          margin: "0 0 6px 0", textAlign: "center"
        }}>
          Nouveau mot de passe
        </h1>
        <p style={{ fontSize: 13, color: C.textMuted, textAlign: "center", margin: "0 0 24px 0" }}>
          Définissez un nouveau mot de passe sécurisé pour votre compte.
        </p>

        {error && (
          <div style={{
            background: "#fce4ec", color: C.danger, padding: "12px 16px", borderRadius: 10,
            fontSize: 13, marginBottom: 20, border: "1px solid #f8bbd0"
          }}>?? {error}</div>
        )}

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "16px", borderRadius: 12, marginBottom: 20 }}>
              ? Mot de passe réinitialisé avec succès !<br/>
              Vous pouvez maintenant vous connecter.
            </div>
            <button
              onClick={onBackToLogin}
              style={{
                background: "transparent", color: C.navy, border: "2px solid "+C.navy, padding: "12px 24px",
                borderRadius: 10, fontWeight: 700, cursor: "pointer", width: "100%", fontSize: 14
              }}>Retourner à la connexion</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Créer un nouveau mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={mdp}
                  onChange={e => { setMdp(e.target.value); setError(null); }}
                  placeholder="8 caractères, Maj, chiffre..."
                  autoComplete="new-password"
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "13px 46px 13px 16px", borderRadius: 10,
                    border: `1.5px solid ${C.border}`, fontFamily: "inherit", fontSize: 14,
                    color: C.text, outline: "none", background: C.white
                  }}
                />
                <button
                  type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPwd ? <EyeOff size={18} color="#8892a4" /> : <Eye size={18} color="#8892a4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading} className="reset-btn"
              style={{
                background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "15px",
                fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
              {loading ? "Enregistrement..." : "Enregistrer et se connecter"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
