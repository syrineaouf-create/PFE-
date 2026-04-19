import { useState, useEffect } from 'react';
import Admin from './pages/admin/admin';
import ApprenantPortal from './pages/apprenant/apprenant';
import FormateurPortal from './pages/formateur/formateur';
import VisitorPortal from './pages/visitor/visitor';
import LoginPage from './pages/apprenant/login';
import ResetPasswordPage from './pages/apprenant/ResetPassword';
import AIAgent from './components/AIAgent';
import { Globe, ShieldCheck, GraduationCap, Presentation } from 'lucide-react';

function App() {
  const [route, setRoute] = useState(() => {
    // Restaurer la route si l'utilisateur rafraîchit la page (F5)
    if (sessionStorage.getItem('apprenant_session')) return 'apprenant';
    if (sessionStorage.getItem('admin_session')) return 'admin';
    if (sessionStorage.getItem('formateur_session')) return 'formateur';
    return sessionStorage.getItem('current_route') || 'visitor';
  });
  const [loginRole, setLoginRole] = useState(null);
  const [resetTokenInfo, setResetTokenInfo] = useState(null);

  useEffect(() => {
    sessionStorage.setItem('current_route', route);
  }, [route]);

  useEffect(() => {
    // Check for token on startup
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    const role = params.get('role');
    if (token && role) {
      setResetTokenInfo({ token, role });
      setRoute('reset-password');
      // Clean URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const goToLogin = (role = null) => {
    setLoginRole(role);
    setRoute('login');
  };

  // Called by LoginPage after successful auth
  const handleLogin = (userData, role) => {
    if (role === 'admin') setRoute('admin');
    else if (role === 'formateur') setRoute('formateur');
    else setRoute('apprenant');
  };

  return (
    <>
      {route === 'visitor'   && <VisitorPortal onLoginClick={() => goToLogin(null)} onAdminLogin={() => goToLogin('admin')} />}
      {route === 'login'     && (
        <LoginPage
          forcedRole={loginRole}
          onLogin={handleLogin}
          onBack={() => setRoute('visitor')}
          // Si on est sur la page login, "Créer mon compte" ramène au visitor qui contient le formulaire
          onGoToRegister={() => { setRoute('visitor'); setTimeout(() => document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
        />
      )}
      {route === 'apprenant' && <ApprenantPortal onGoToLogin={() => goToLogin('apprenant')} onGoToVisitor={() => setRoute('visitor')} />}
      {route === 'formateur' && <FormateurPortal onGoToLogin={() => goToLogin('formateur')} />}
      {route === 'admin'     && <Admin onLogout={() => setRoute('visitor')} />}
      {route === 'reset-password' && resetTokenInfo && (
        <ResetPasswordPage 
          resetToken={resetTokenInfo.token} 
          role={resetTokenInfo.role} 
          onBackToLogin={() => goToLogin()} 
        />
      )}
      
      <AIAgent />
    </>
  );
}

export default App;
