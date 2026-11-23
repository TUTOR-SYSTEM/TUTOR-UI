
#!/usr/bin/env bash

REPOS=(
  "gateway"
  "USER"
  "tutor-service"
  "THIRD_SERVICE"
  "TUTOR-UI"
)

ORG="TUTOR-SYSTEM"
BASE_DIR="$HOME/tutor"

mkdir -p "$BASE_DIR"
cd "$BASE_DIR" || exit 1

for repo in "${REPOS[@]}"; do
  echo "================================"
  echo "Processing: $repo"
  echo "================================"

  if [ -d "$repo/.git" ]; then
    echo "Pulling $repo..."
    (
      cd "$repo" || exit 1
      git pull --ff-only
    )
  else
    echo "Cloning $repo..."
    git clone "git@github.com:$ORG/$repo.git"
  fi

  if [ $? -eq 0 ]; then
    echo "SUCCESS: $repo"
  else
    echo "FAILED: $repo"
  fi

  echo
done

echo "All repositories processed."
