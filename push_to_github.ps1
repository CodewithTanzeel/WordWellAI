cd "C:\Users\hp\OneDrive\Desktop\Hackathons\WordWellAI"

Write-Host "=== Configuring Git ===" -ForegroundColor Green
git config --global user.email "developer@wordwellai.dev"
git config --global user.name "WordWellAI Developer"

Write-Host ""
Write-Host "=== Git Status ===" -ForegroundColor Green
git status

Write-Host ""
Write-Host "=== Adding Files ===" -ForegroundColor Green
git add -A

Write-Host ""
Write-Host "=== Committing ===" -ForegroundColor Green
git commit -m "Integrate HF Space with Mistral-7B-Instruct and local heuristic fallback"

Write-Host ""
Write-Host "=== Pushing to GitHub ===" -ForegroundColor Green
git push origin main

Write-Host ""
Write-Host "✅ Done! Code pushed to https://github.com/CodewithTanzeel/WordWellAI" -ForegroundColor Cyan
