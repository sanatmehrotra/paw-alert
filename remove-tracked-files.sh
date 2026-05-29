#!/bin/bash
# This script removes ignored files from Git tracking

git rm --cached .agent/skills 2>/dev/null || true
git rm --cached .claude/skills 2>/dev/null || true
git rm --cached supabase-setup.sql 2>/dev/null || true
git rm --cached .supabase-reset.sql 2>/dev/null || true
git rm --cached skills-lock.json 2>/dev/null || true

git commit -m "Remove ignored files from Git tracking"
