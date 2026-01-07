// Service Worker para Proprietário PWA
const CACHE_NAME = 'proprietario-v1';

// Instalar - não precisa cachear nada por enquanto
self.addEventListener('install', event => {
  console.log('Service Worker Proprietário: Instalado');
  self.skipWaiting();
});

// Ativar
self.addEventListener('activate', event => {
  console.log('Service Worker Proprietário: Ativado');
  event.waitUntil(clients.claim());
});

// Fetch - passar direto (network first)
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
