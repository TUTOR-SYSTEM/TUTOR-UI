#!/usr/bin/env bash
# Commit và push mọi thay đổi trong 5 source repo (ui, tutor, user, third, gateway) lên GitHub.
#
# Với mỗi repo:
#   - bỏ qua nếu working tree sạch
#   - git add -A (trừ .env*, *.pem, *.key, credentials — KHÔNG bao giờ commit secret)
#   - commit với message tự sinh từ diff (hoặc -m nếu truyền vào), không có body/Co-Authored-By
#   - push lên branch hiện tại của repo (không force)
#
# Dùng:
#   scripts/push-commit.sh                       # commit + push, message tự sinh
#   scripts/push-commit.sh -m "feat: ..."        # dùng message cố định
#   scripts/push-commit.sh -n                    # dry-run: chỉ hiện message và file sẽ commit
#   scripts/push-commit.sh -r "ui gateway"       # chỉ một số repo
#   scripts/push-commit.sh -h                    # trợ giúp

set -uo pipefail

ROOT="${ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
REPOS="ui tutor user third gateway"
MSG=""
DRY=0

usage() { sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; }

while getopts "m:r:nh" opt; do
  case "$opt" in
    m) MSG="$OPTARG" ;;
    r) REPOS="$OPTARG" ;;
    n) DRY=1 ;;
    h) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done

if [ -t 1 ]; then G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; N=$'\e[0m'; else G=; Y=; R=; N=; fi
ok=(); skipped=(); failed=()

EXCLUDES=(':(exclude,glob)**/.env' ':(exclude,glob)**/.env.*' ':(exclude,glob)**/*.pem' ':(exclude,glob)**/*.key')

# Sinh message một dòng từ những gì đang staged: số file thêm/sửa/xóa + thư mục bị ảnh hưởng.
gen_msg() {
  local dir="$1" repo="$2" a m d dirs
  a=$(git -C "$dir" diff --cached --name-status | grep -c '^A')
  m=$(git -C "$dir" diff --cached --name-status | grep -c '^M')
  d=$(git -C "$dir" diff --cached --name-status | grep -c '^D')
  dirs=$(git -C "$dir" diff --cached --name-only | awk -F/ 'NF>1{print $1"/"$2; next}{print "(root)"}' | sort -u | head -4 | paste -sd, -)
  echo "update($repo): source changes — ${a} added, ${m} modified, ${d} deleted [${dirs}]"
}

for repo in $REPOS; do
  dir="$ROOT/$repo"
  echo "=== $repo"
  if ! git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "${Y}  bỏ qua: không phải git repo ($dir)${N}"; skipped+=("$repo"); continue
  fi

  branch="$(git -C "$dir" branch --show-current)"
  if [ -z "$branch" ]; then
    echo "${R}  lỗi: đang ở detached HEAD${N}"; failed+=("$repo"); continue
  fi

  git -C "$dir" add -A -- . "${EXCLUDES[@]}" 2>&1 | sed 's/^/  /'
  if git -C "$dir" diff --cached --quiet; then
    echo "${Y}  bỏ qua: không có thay đổi${N}"; skipped+=("$repo"); continue
  fi

  msg="${MSG:-$(gen_msg "$dir" "$repo")}"

  if [ "$DRY" -eq 1 ]; then
    echo "  [dry-run] branch $branch, message: $msg"
    git -C "$dir" diff --cached --stat | sed 's/^/  /'
    git -C "$dir" reset -q -- . 2>/dev/null
    ok+=("$repo"); continue
  fi

  if ! git -C "$dir" commit -q -m "$msg" 2>&1 | sed 's/^/  /'; then
    echo "${R}  lỗi: commit thất bại${N}"; failed+=("$repo"); continue
  fi

  if git -C "$dir" push origin "$branch" 2>&1 | sed 's/^/  /'; then
    echo "${G}  ok: đã push $branch${N}"; ok+=("$repo")
  else
    echo "${R}  lỗi: push $branch thất bại (commit vẫn ở local)${N}"; failed+=("$repo")
  fi
done

echo
echo "Tổng kết: ok=${#ok[@]} (${ok[*]:-}) | bỏ qua=${#skipped[@]} (${skipped[*]:-}) | lỗi=${#failed[@]} (${failed[*]:-})"
[ "${#failed[@]}" -eq 0 ]
