#!/bin/bash
cd "C:/Users/hp/OneDrive/Desktop/Hackathons/WordWellAI"

# Configure git
git config --global user.email "developer@wordwellai.dev"
git config --global user.name "WordWellAI Developer"

# Check status
echo "=== Git Status ==="
git status

# Add all changes
echo ""
echo "=== Adding files ==="
git add -A
git status

# Commit
echo ""
echo "=== Committing ==="
git commit -m "Add HF Space integration with Mistral-7B-Instruct and local heuristic fallback"

# Push to main
echo ""
echo "=== Pushing to GitHub ==="
git push origin main

echo ""
echo "=== Done ==="
echo "Code pushed to https://github.com/CodewithTanzeel/WordWellAI"
