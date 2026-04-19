import axios from 'axios';

// Configuration de l'URL racine de votre backend NestJS
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important pour autoriser le partage des cookies/sessions si nécessaire
});

// Ajout du token JWT à chaque requête entrante
api.interceptors.request.use((config) => {
  // Le token est stocké selon le rôle connecté
  const apprenant = sessionStorage.getItem('apprenant_session');
  const admin = sessionStorage.getItem('admin_session');
  const formateur = sessionStorage.getItem('formateur_session');

  let session = null;
  if (apprenant) session = JSON.parse(apprenant);
  else if (admin) session = JSON.parse(admin);
  else if (formateur) session = JSON.parse(formateur);

  if (session && session.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepteur global pour déconnecter si le token JWT expire (401 Non Autorisé)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si on reçoit 401 mais qu'on n'est PAS sur la route de login (sinon ça bloque les erreurs de mauvais mot de passe)
    if (error.response && error.response.status === 401 && !error.config.url.includes('/login')) {
      // Nettoyage des sessions expirées
      sessionStorage.removeItem('apprenant_session');
      sessionStorage.removeItem('admin_session');
      sessionStorage.removeItem('formateur_session');
      
      // Forcer le rechargement vers l'écran de connexion si on n'y est pas déjà
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
