#!/bin/bash

# Script para Separar Projeto em Branches
# Uso: ./separar-branches.sh

set -e

echo "============================================"
echo "  Separador de Branches - Lucro Líquido"
echo "============================================"

# Verificar se está em um repositório git
if [ ! -d ".git" ]; then
    echo "❌ Erro: Execute este script na raiz do repositório git"
    exit 1
fi

# Salvar branch atual
ORIGINAL_BRANCH=$(git branch --show-current)
echo "Branch atual: $ORIGINAL_BRANCH"

# Confirmar antes de continuar
read -p "Isso vai criar 3 novas branches. Continuar? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi

# ==========================================
# BRANCH: deploy/backend
# ==========================================
echo ""
echo "📦 Criando branch deploy/backend..."

git checkout -b deploy/backend 2>/dev/null || git checkout deploy/backend

# Remover arquivos não necessários
rm -rf frontend/ 2>/dev/null || true
rm -rf node_modules/ 2>/dev/null || true
rm -f docker-compose.yml 2>/dev/null || true
rm -f DEPLOY_FRONTEND.md 2>/dev/null || true
rm -f DEPLOY_COMPLETO.md 2>/dev/null || true

# Mover backend para raiz
if [ -d "backend" ]; then
    cp -r backend/* . 2>/dev/null || true
    rm -rf backend/
fi

git add -A
git commit -m "chore: backend only for deployment" || true
echo "✅ Branch deploy/backend criada"

# ==========================================
# BRANCH: deploy/frontend
# ==========================================
echo ""
echo "🎨 Criando branch deploy/frontend..."

git checkout $ORIGINAL_BRANCH
git checkout -b deploy/frontend 2>/dev/null || git checkout deploy/frontend

# Remover arquivos não necessários
rm -rf backend/ 2>/dev/null || true
rm -rf database/ 2>/dev/null || true
rm -f docker-compose.yml 2>/dev/null || true
rm -f DEPLOY_BACKEND.md 2>/dev/null || true
rm -f DEPLOY_DATABASE.md 2>/dev/null || true
rm -f DEPLOY_COMPLETO.md 2>/dev/null || true

# Mover frontend para raiz
if [ -d "frontend" ]; then
    cp -r frontend/* . 2>/dev/null || true
    rm -rf frontend/
fi

git add -A
git commit -m "chore: frontend only for deployment" || true
echo "✅ Branch deploy/frontend criada"

# ==========================================
# BRANCH: deploy/database
# ==========================================
echo ""
echo "🗄️  Criando branch deploy/database..."

git checkout $ORIGINAL_BRANCH
git checkout -b deploy/database 2>/dev/null || git checkout deploy/database

# Remover tudo exceto configs de banco
rm -rf backend/ 2>/dev/null || true
rm -rf frontend/ 2>/dev/null || true
rm -rf node_modules/ 2>/dev/null || true

# Manter apenas pasta database e docs relacionados
mkdir -p database

# Copiar docker-compose se existir
if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml database/
fi

# Manter docs de database
cp DEPLOY_DATABASE.md database/ 2>/dev/null || true

git add -A
git commit -m "chore: database configs for deployment" || true
echo "✅ Branch deploy/database criada"

# ==========================================
# VOLTAR PARA BRANCH ORIGINAL
# ==========================================
echo ""
git checkout $ORIGINAL_BRANCH

echo ""
echo "============================================"
echo "  ✅ Branches criadas com sucesso!"
echo "============================================"
echo ""
echo "Branches disponíveis:"
echo "  - deploy/backend   (para Railway/Render)"
echo "  - deploy/frontend  (para Vercel/Netlify)"
echo "  - deploy/database  (configs MongoDB)"
echo ""
echo "Para enviar para GitHub:"
echo "  git push origin deploy/backend"
echo "  git push origin deploy/frontend"
echo "  git push origin deploy/database"
echo ""
