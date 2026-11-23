#!/usr/bin/env bash
# Cập nhật nhánh `develop` cho tất cả source (ui, tutor, user, third, gateway).
#
# Mặc định an toàn: chỉ fast-forward nhánh `develop` LOCAL từ origin/develop,
# KHÔNG đổi nhánh đang làm và KHÔNG đụng working tree.
#
# Dùng:
#   scripts/pull-develop.sh                # cập nhật develop local (không đổi nhánh)
#   scripts/pull-develop.sh -c             # checkout develop rồi pull (--ff-only)
#   scripts/pull-develop.sh -m             # merge origin/develop vào nhánh hiện tại
#   scripts/pull-develop.sh -r "ui user"   # chỉ các repo chỉ định
#   scripts/pull-develop.sh -h             # trợ giúp
#
# Các repo được coi là thư mục anh em của `ui` (cùng thư mục cha). Đổi bằng biến ROOT.

set -uo pipefail

ROOT="${ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
REPOS="ui tutor user third gateway"
BRANCH="develop"
MODE="update"   # update | checkout | merge

usage() { sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; }

while getopts "cmr:h" opt; do
  case "$opt" in
    c) MODE="checkout" ;;
    m) MODE="merge" ;;
    r) REPOS="$OPTARG" ;;
    h) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done

if [ -t 1 ]; then G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; N=$'\e[0m'; else G=; Y=; R=; N=; fi
ok=(); skipped=(); failed=()

for repo in $REPOS; do
  dir="$ROOT/$repo"
  echo "=== $repo"
  if ! git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "${Y}  bỏ qua: không phải git repo ($dir)${N}"; skipped+=("$repo"); continue
  fi

  current="$(git -C "$dir" branch --show-current)"
  fetch_out="$(git -C "$dir" fetch origin "$BRANCH" --prune 2>&1)"; fetch_rc=$?
  [ -n "$fetch_out" ] && printf '%s\n' "$fetch_out" | sed 's/^/  /'
  if [ "$fetch_rc" -ne 0 ]; then
    echo "${R}  lỗi: fetch origin/$BRANCH thất bại${N}"; failed+=("$repo"); continue
  fi

  dirty="$(git -C "$dir" status --porcelain --untracked-files=no)"

  case "$MODE" in
    update)
      if [ "$current" = "$BRANCH" ]; then
        if [ -n "$dirty" ]; then
          echo "${Y}  bỏ qua: đang ở $BRANCH nhưng có thay đổi chưa commit${N}"; skipped+=("$repo"); continue
        fi
        git -C "$dir" merge --ff-only "origin/$BRANCH" 2>&1 | sed 's/^/  /'
      else
        # cập nhật ref develop local mà không checkout (chỉ cho phép fast-forward)
        git -C "$dir" fetch origin "$BRANCH:$BRANCH" 2>&1 | sed 's/^/  /'
      fi
      rc=${PIPESTATUS[0]} ;;
    checkout)
      if [ -n "$dirty" ]; then
        echo "${Y}  bỏ qua: có thay đổi chưa commit, không checkout được${N}"; skipped+=("$repo"); continue
      fi
      git -C "$dir" checkout "$BRANCH" 2>&1 | sed 's/^/  /'
      [ "${PIPESTATUS[0]}" -eq 0 ] && git -C "$dir" merge --ff-only "origin/$BRANCH" 2>&1 | sed 's/^/  /'
      rc=${PIPESTATUS[0]} ;;
    merge)
      if [ -n "$dirty" ]; then
        echo "${Y}  bỏ qua: có thay đổi chưa commit, không merge được${N}"; skipped+=("$repo"); continue
      fi
      echo "  merge origin/$BRANCH vào $current"
      git -C "$dir" merge --no-edit "origin/$BRANCH" 2>&1 | sed 's/^/  /'
      rc=${PIPESTATUS[0]} ;;
  esac

  if [ "${rc:-1}" -eq 0 ]; then
    echo "${G}  ok${N}"; ok+=("$repo")
  else
    echo "${R}  lỗi (xem output ở trên)${N}"; failed+=("$repo")
  fi
done

echo
echo "Tổng kết: ok=${#ok[@]} (${ok[*]:-}) | bỏ qua=${#skipped[@]} (${skipped[*]:-}) | lỗi=${#failed[@]} (${failed[*]:-})"
[ "${#failed[@]}" -eq 0 ]
