# Deploy Firestore Rules to Firebase (PowerShell)

Write-Host "🚀 Deploying Firestore Rules..." -ForegroundColor Green
Write-Host ""

# Check if firebase-tools is installed
try {
    firebase status 2>$null
} catch {
    Write-Host "📦 Installing Firebase CLI..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

# Check if user is logged in
Write-Host "🔐 Checking Firebase authentication..." -ForegroundColor Cyan
firebase status

Write-Host ""
Write-Host "📋 Rules to be deployed from: firestore.rules" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Deploying rules..." -ForegroundColor Green
firebase deploy --only firestore:rules

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure you're logged in: firebase login"
    Write-Host "2. Make sure you're in the correct directory"
    Write-Host "3. Make sure firestore.rules file exists"
}
