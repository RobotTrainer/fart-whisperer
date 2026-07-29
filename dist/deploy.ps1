# ============================================================================
#  VENTRILOQUIUM - deploy The Fart Whisperer to Cloudflare Pages
#  Only needed if you want repeatable command-line deploys. Requires Node.
#
#  First time:   winget install OpenJS.NodeJS.LTS      (then reopen PowerShell)
#  Then:         powershell -ExecutionPolicy Bypass -File .\deploy.ps1
#  After edits:  the same command again
# ============================================================================

$project = 'ventriloquium'

Write-Host ''
Write-Host 'Ventriloquium - Cloudflare Pages' -ForegroundColor White
Write-Host ''

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host '  Node.js is not installed.' -ForegroundColor Yellow
    Write-Host '  Run:  winget install OpenJS.NodeJS.LTS'
    Write-Host '  Then close PowerShell, open it again, and re-run this script.'
    exit 1
}
Write-Host ('  node ' + (node --version)) -ForegroundColor Cyan

if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Host '  installing Wrangler...' -ForegroundColor Cyan
    npm install -g wrangler
}

if (-not (Test-Path (Join-Path $PSScriptRoot 'index.html'))) {
    Write-Host '  index.html not found. Run this from the dist folder.' -ForegroundColor Yellow
    exit 1
}
Write-Host '  index.html present' -ForegroundColor Green

Write-Host '  logging in (a browser may open once)...' -ForegroundColor Cyan
wrangler login

Write-Host '  creating the project if it does not exist...' -ForegroundColor Cyan
wrangler pages project create $project --production-branch main

Write-Host '  uploading...' -ForegroundColor Cyan
wrangler pages deploy $PSScriptRoot --project-name $project --commit-dirty=true

Write-Host ''
Write-Host '  Done. Live at https://ventriloquium.pages.dev' -ForegroundColor Green
Write-Host ''
Write-Host '  One step left, in the Cloudflare dashboard:' -ForegroundColor White
Write-Host '     Workers and Pages  ->  ventriloquium  ->  Custom domains'
Write-Host '     Set up a custom domain  ->  ventriloquium.thewordhoard.com'
Write-Host ''
