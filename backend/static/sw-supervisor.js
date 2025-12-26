// Service Worker para Supervisor PWA
const CACHE_NAME = 'supervisor-v1';

// Instalar - não precisa cachear nada por enquanto
self.addEventListener('install', event => {
  console.log('Service Worker: Instalado');
  self.skipWaiting();
});

// Ativar
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativado');
  event.waitUntil(clients.claim());
});

// Fetch - passar direto (network first)
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
