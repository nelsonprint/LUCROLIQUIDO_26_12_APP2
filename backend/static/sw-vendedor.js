// Service Worker para Vendedor PWA
const CACHE_NAME = 'vendedor-v1';

// Instalar
self.addEventListener('install', event => {
  console.log('Service Worker Vendedor: Instalado');
  self.skipWaiting();
});

// Ativar
self.addEventListener('activate', event => {
  console.log('Service Worker Vendedor: Ativado');
  event.waitUntil(clients.claim());
});

// Fetch - passar direto (network first)
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
