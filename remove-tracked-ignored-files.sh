#!/bin/bash
# This script removes tracked ignored files from Git using GitHub API

# Files to remove
FILES=(
  "skills-lock.json"
  "supabase-setup.sql"
  "supabase-reset.sql"
)

OWNER="sanatmehrotra"
REPO="paw-alert"
BRANCH="master"

# GitHub credentials should be set as environment variables:
# GITHUB_TOKEN - your personal access token

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is not set"
  echo "Please set your GitHub token: export GITHUB_TOKEN=your_token"
  exit 1
fi

echo "Starting to remove tracked ignored files..."

# For each file, delete it via GitHub API
for file in "${FILES[@]}"; do
  echo "Removing $file..."
  
  # Get the current file SHA
  RESPONSE=$(curl -s -X GET \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$OWNER/$REPO/contents/$file?ref=$BRANCH")
  
  FILE_SHA=$(echo "$RESPONSE" | grep -o '"sha": "[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -z "$FILE_SHA" ]; then
    echo "  Warning: Could not find SHA for $file"
    continue
  fi
  
  # Delete the file
  curl -s -X DELETE \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -d "{\"message\":\"Remove tracked ignored file: $file\",\"sha\":\"$FILE_SHA\",\"branch\":\"$BRANCH\"}" \
    "https://api.github.com/repos/$OWNER/$REPO/contents/$file"
  
  echo "  ✓ Removed $file"
done

echo "Done! All tracked ignored files have been removed from the repository."
