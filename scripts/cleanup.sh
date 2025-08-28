#!/usr/bin/env bash
set -euo pipefail

paths=(
  "src/App.css"
  "src/lib/google-sheets-service.ts"
  "src/import"
  "src/pages/ImportCsv.tsx"
  "src/pages/admin/ImportCsv.tsx"
  "src/components/Sidebar.tsx"
  "src/context/chart-theme.ts"
  "src/lib/chart-theme.ts"
  "src/hooks/use-toast.ts"
  "src/components/layouts/AppLayout.tsx"
  "src/layouts/AppLayout.tsx"
)

for p in "${paths[@]}"; do
  if [ -e "$p" ] || [ -d "$p" ]; then
    if git ls-files --error-unmatch "$p" >/dev/null 2>&1; then
      echo "git rm -f $p"
      git rm -f "$p"
    else
      echo "rm -rf $p"
      rm -rf "$p"
    fi
  else
    echo "skip (not found): $p"
  fi
done
