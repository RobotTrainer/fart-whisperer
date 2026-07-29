<#
=============================================================================
  VENTRILOQUIUM — deploy The Fart Whisperer into the Word Hoard family
  ventriloquium.thewordhoard.com

  Run from this folder:      .\deploy.ps1
  Re-deploy after an edit:   .\deploy.ps1            (same command, it updates)

  What it does
    1. checks Node and installs Wrangler if missing
    2. logs you into Cloudflare (opens a browser once, then remembers)
    3. creates the Pages project 'ventriloquium' if it does not exist
    4. uploads this folder
    5. attaches the custom domain — automatically if you give it an API token,
       otherwise it prints the one dashboard step

  The site is a single self-contained index.html. Nothing to build.
=============================================================================
#>

param(
  [string]$ProjectName = "ventriloquium",
  [string]$Domain      = "ventriloquium.thewordhoard.com",
  [string]$AccountId   = "",   # optional — only needed to attach the domain automatically
  [string]$ApiToken    = ""    # optional — Cloudflare API token with Pages:Edit + DNS:Edit
)

$ErrorActionPreference = "Stop"
function Say($m){ Write-Host "  $m" -ForegroundColor Cyan }
function Ok ($m){ Write-Host "  $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  $m" -ForegroundColor Yellow }

Write-Host ""
Write-Host "=== Ventriloquium -> Cloudflare Pages ===" -ForegroundColor White
Write-Host ""

# ---- 1. prerequisites -------------------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Warn "Node.js is not installed. Get it from https://nodejs.org and run this again."
  exit 1
}
Say "node $(node --version)"

if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
  Say "installing Wrangler (Cloudflare's CLI)…"
  npm install -g wrangler | Out-Null
}
Say "wrangler $(wrangler --version)"

# ---- 2. sanity check the payload -------------------------------------------
if (-not (Test-Path "$PSScriptRoot\index.html")) {
  Warn "index.html is not in this folder. Run the script from the deploy folder."
  exit 1
}
$size = [math]::Round((Get-Item "$PSScriptRoot\index.html").Length / 1KB)
Ok "index.html present ($size KB, self-contained)"

# ---- 3. login ---------------------------------------------------------------
Say "checking Cloudflare login…"
$who = (wrangler whoami 2>&1 | Out-String)
if ($who -match "not authenticated|You are not logged in") {
  Say "opening a browser to log in…"
  wrangler login
}

# ---- 4. project -------------------------------------------------------------
$projects = (wrangler pages project list 2>&1 | Out-String)
if ($projects -notmatch [regex]::Escape($ProjectName)) {
  Say "creating Pages project '$ProjectName'…"
  wrangler pages project create $ProjectName --production-branch main
} else {
  Say "project '$ProjectName' already exists"
}

# ---- 5. deploy --------------------------------------------------------------
Say "uploading…"
wrangler pages deploy $PSScriptRoot --project-name $ProjectName --commit-dirty=true
Ok "deployed — it is live at https://$ProjectName.pages.dev"

# ---- 6. custom domain -------------------------------------------------------
Write-Host ""
if ($AccountId -and $ApiToken) {
  Say "attaching $Domain …"
  $headers = @{ "Authorization" = "Bearer $ApiToken"; "Content-Type" = "application/json" }
  $uri  = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName/domains"
  $body = @{ name = $Domain } | ConvertTo-Json
  try {
    $r = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body
    if ($r.success) { Ok "attached. https://$Domain will resolve once the certificate issues (a few minutes)." }
    else { Warn ("Cloudflare said: " + ($r.errors | ConvertTo-Json -Compress)) }
  } catch {
    Warn "could not attach automatically: $($_.Exception.Message)"
    Warn "do it in the dashboard instead — see below."
  }
} else {
  Write-Host "  ONE STEP LEFT — attach the custom domain:" -ForegroundColor White
  Write-Host "     Cloudflare dashboard -> Workers & Pages -> $ProjectName"
  Write-Host "     -> Custom domains -> Set up a custom domain"
  Write-Host "     -> enter:  $Domain"
  Write-Host ""
  Write-Host "  Cloudflare creates the CNAME itself because thewordhoard.com is already"
  Write-Host "  on your account. The certificate takes a few minutes."
  Write-Host ""
  Write-Host "  To skip that click next time, pass a token:" -ForegroundColor DarkGray
  Write-Host "     .\deploy.ps1 -AccountId <id> -ApiToken <token>" -ForegroundColor DarkGray
}

Write-Host ""
Ok "When $Domain is live, both easter eggs work with no code change —"
Ok "they already point at that address."
Write-Host ""
