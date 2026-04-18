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
  const apprenant = localStorage.getItem('apprenant_session');
  const admin = localStorage.getItem('admin_session');
  const formateur = localStorage.getItem('formateur_session');

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

export default api;
