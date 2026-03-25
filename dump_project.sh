#!/bin/bash

set -euo pipefail

OUT_DIR="ai_dump_chunks"
MASTER_FILE="$OUT_DIR/master_dump.txt"
BACKEND_REVIEW_FILE="$OUT_DIR/backend_review_chunk.txt"
FRONTEND_REVIEW_FILE="$OUT_DIR/frontend_review_chunk.txt"

PER_FILE_LIMIT="-1M"          # include files smaller than 1 MB each in the general dump
CHUNK_LINES=20000             # split master dump every 20k lines
INCLUDE_REAL_ENV=false        # set to true only if you really want .env contents included

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR"/chunk_* "$MASTER_FILE" "$BACKEND_REVIEW_FILE" "$FRONTEND_REVIEW_FILE"

TMP_FILE="$(mktemp -t ai_dump.XXXXXX)"

cleanup() {
  rm -f "$TMP_FILE"
}
trap cleanup EXIT

print_file_block() {
  local f="$1"

  if [ ! -f "$f" ]; then
    return
  fi

  case "$f" in
    */.env|./backend/.env|./frontend/.env|./frontend/.env.local|./backend/.env.local)
      if [ "$INCLUDE_REAL_ENV" != true ]; then
        return
      fi
      ;;
  esac

  printf '\n\n==================== FILE: %s ====================\n\n' "$f"

  if file --mime "$f" | grep -q 'charset=binary'; then
    echo "[binary file omitted]"
  else
    cat "$f"
  fi
}

echo "Building general dump into temporary file..."
echo "Per-file size limit: $PER_FILE_LIMIT"
echo "Chunk size (lines): $CHUNK_LINES"
echo

{
  echo "==================== PROJECT TREE ===================="
  find . \
    \( \
      -name ".git" -o \
      -name "node_modules" -o \
      -name ".next" -o \
      -name "dist" -o \
      -name "build" -o \
      -name "coverage" -o \
      -name "venv" -o \
      -name ".venv" -o \
      -name "__pycache__" -o \
      -name ".mypy_cache" -o \
      -name ".pytest_cache" -o \
      -name ".turbo" -o \
      -name ".cache" -o \
      -name ".idea" -o \
      -name ".vscode" -o \
      -name "$OUT_DIR" \
    \) -prune -o -print

  echo
  echo "==================== FILE CONTENTS ===================="

  find . \
    \( \
      -name ".git" -o \
      -name "node_modules" -o \
      -name ".next" -o \
      -name "dist" -o \
      -name "build" -o \
      -name "coverage" -o \
      -name "venv" -o \
      -name ".venv" -o \
      -name "__pycache__" -o \
      -name ".mypy_cache" -o \
      -name ".pytest_cache" -o \
      -name ".turbo" -o \
      -name ".cache" -o \
      -name ".idea" -o \
      -name ".vscode" -o \
      -name "$OUT_DIR" \
    \) -prune -o \
    -type f \
    \( \
      -name "*.py" -o \
      -name "*.pyi" -o \
      -name "*.ts" -o \
      -name "*.tsx" -o \
      -name "*.js" -o \
      -name "*.jsx" -o \
      -name "*.mjs" -o \
      -name "*.cjs" -o \
      -name "*.sql" -o \
      -name "*.sh" -o \
      -name "*.bash" -o \
      -name "*.zsh" -o \
      -name "*.json" -o \
      -name "*.jsonc" -o \
      -name "*.yml" -o \
      -name "*.yaml" -o \
      -name "*.toml" -o \
      -name "*.ini" -o \
      -name "*.cfg" -o \
      -name "*.conf" -o \
      -name "*.md" -o \
      -name "*.graphql" -o \
      -name "*.gql" -o \
      -name "*.proto" -o \
      -name "*.css" -o \
      -name "*.scss" -o \
      -name "*.sass" -o \
      -name "*.less" -o \
      -name "*.html" -o \
      -name "*.xml" -o \
      -name "*.d.ts" -o \
      -name "Dockerfile" -o \
      -name "docker-compose.yml" -o \
      -name "docker-compose.yaml" -o \
      -name "Makefile" -o \
      -name "Procfile" -o \
      -name ".gitignore" -o \
      -name ".gitattributes" -o \
      -name ".editorconfig" -o \
      -name ".env.example" -o \
      -name ".env.local.example" -o \
      -name "package.json" -o \
      -name "package-lock.json" -o \
      -name "pnpm-lock.yaml" -o \
      -name "yarn.lock" -o \
      -name "tsconfig.json" -o \
      -name "jsconfig.json" -o \
      -name "next.config.js" -o \
      -name "next.config.ts" -o \
      -name "next.config.mjs" -o \
      -name "vite.config.js" -o \
      -name "vite.config.ts" -o \
      -name "tailwind.config.js" -o \
      -name "tailwind.config.ts" -o \
      -name "postcss.config.js" -o \
      -name "postcss.config.mjs" -o \
      -name "eslint.config.js" -o \
      -name "eslint.config.mjs" -o \
      -name "requirements.txt" -o \
      -name "pyproject.toml" -o \
      -name "Pipfile" -o \
      -name "Pipfile.lock" -o \
      -name "poetry.lock" -o \
      -path "./.github/workflows/*.yml" -o \
      -path "./.github/workflows/*.yaml" \
    \) \
    ! -name ".DS_Store" \
    ! -name "._*" \
    ! -name "*.min.js" \
    ! -name "*.min.css" \
    ! -name "*.map" \
    ! -name "*.session.sql" \
    ! -name "master_dump.txt" \
    ! -name "backend_review_chunk.txt" \
    ! -name "frontend_review_chunk.txt" \
    ! -name "chunk_*" \
    ! -name "ai_*dump*.txt" \
    ! -name "*project_dump*.txt" \
    ! -path "./public/*" \
    ! -path "./frontend/public/*" \
    ! -path "./assets/*" \
    ! -path "./static/*" \
    -size "$PER_FILE_LIMIT" \
    -print0 |
  while IFS= read -r -d '' f; do
    case "$f" in
      */.env|*/.env.local)
        if [ "$INCLUDE_REAL_ENV" != true ]; then
          continue
        fi
        ;;
    esac

    printf '\n\n==================== FILE: %s ====================\n\n' "$f"

    if file --mime "$f" | grep -q 'charset=binary'; then
      echo "[binary file omitted]"
    else
      cat "$f"
    fi
  done
} > "$TMP_FILE"

cp "$TMP_FILE" "$MASTER_FILE"

echo "Splitting master dump into chunks..."
split -l "$CHUNK_LINES" -d -a 2 "$TMP_FILE" "$OUT_DIR/chunk_"

for f in "$OUT_DIR"/chunk_*; do
  [ -e "$f" ] || continue
  case "$f" in
    *.txt) ;;
    *) mv "$f" "$f.txt" ;;
  esac
done

echo "Building dedicated backend review chunk..."
{
  echo "==================== BACKEND REVIEW CHUNK ===================="
  echo "This file intentionally repeats selected backend files for focused code review."
  echo
  echo "==================== BACKEND TREE ===================="
  find ./backend -maxdepth 2 2>/dev/null | sort
  echo
  echo "==================== BACKEND FILE CONTENTS ===================="

  print_file_block "./backend/ee_curriculum.json"
  print_file_block "./backend/auth.py"
  print_file_block "./backend/.DS_Store"
  print_file_block "./backend/models.py"
  print_file_block "./backend/requirements.txt"
  print_file_block "./backend/schema.sql"
  print_file_block "./backend/database.py"
  print_file_block "./backend/test_srs.py"
  print_file_block "./backend/reset_db.py"
  print_file_block "./backend/schemas.py"
  print_file_block "./backend/.gitignore"
  print_file_block "./backend/.env"
  print_file_block "./backend/.env.example"
  print_file_block "./backend/seed_json.py"
  print_file_block "./backend/main.py"
} > "$BACKEND_REVIEW_FILE"

echo "Building dedicated frontend review chunk..."
{
  echo "==================== FRONTEND REVIEW CHUNK ===================="
  echo "This file intentionally repeats selected frontend files for focused code review."
  echo
  echo "==================== FRONTEND TREE ===================="
  find ./frontend/app ./frontend/src 2>/dev/null | sort
  echo
  echo "==================== FRONTEND FILE CONTENTS ===================="

  print_file_block "./frontend/app/settings/page.tsx"
  print_file_block "./frontend/app/favicon.ico"
  print_file_block "./frontend/app/discover/page.tsx"
  print_file_block "./frontend/app/signup/page.tsx"
  print_file_block "./frontend/app/admin/page.tsx"
  print_file_block "./frontend/app/update-password/page.tsx"
  print_file_block "./frontend/app/review/page.tsx"
  print_file_block "./frontend/app/layout.tsx"
  print_file_block "./frontend/app/lessons/[id]/page.tsx"
  print_file_block "./frontend/app/modules/[id]/page.tsx"
  print_file_block "./frontend/app/modules/page.tsx"
  print_file_block "./frontend/app/page.tsx"
  print_file_block "./frontend/app/globals.css"
  print_file_block "./frontend/app/login/page.tsx"
  print_file_block "./frontend/src/types/api.ts"
  print_file_block "./frontend/src/components/Navbar.tsx"
  print_file_block "./frontend/src/components/MasteryChart.tsx"
  print_file_block "./frontend/src/components/MathRenderer.tsx"
  print_file_block "./frontend/src/components/QuizEngine.tsx"
  print_file_block "./frontend/src/components/AuthGuard.tsx"
  print_file_block "./frontend/src/components/OptimizedVideoPlayer.tsx"
} > "$FRONTEND_REVIEW_FILE"

echo
echo "Done."
echo "Created:"
echo "  $MASTER_FILE"
echo "  $OUT_DIR/chunk_*.txt"
echo "  $BACKEND_REVIEW_FILE"
echo "  $FRONTEND_REVIEW_FILE"
echo
du -sh "$OUT_DIR"
echo
wc -l "$MASTER_FILE" "$BACKEND_REVIEW_FILE" "$FRONTEND_REVIEW_FILE"