#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js nao encontrado."; exit 1; }
npx --yes firebase-tools login:list >/dev/null 2>&1 || npx --yes firebase-tools login
npx --yes firebase-tools deploy --only firestore:rules
