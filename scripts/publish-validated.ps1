param(
  [string]$Message = "Publish validated application update"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

npm --prefix frontend run build
if ($LASTEXITCODE -ne 0) {
  throw "Frontend build failed. Publication stopped."
}

git add -A
$status = git status --short

if (-not $status) {
  Write-Output "No validated changes to publish."
  exit 0
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) {
  throw "Git commit failed."
}

git push origin main
if ($LASTEXITCODE -ne 0) {
  throw "Git push failed."
}

npm --prefix frontend run deploy
if ($LASTEXITCODE -ne 0) {
  throw "Deployment failed."
}

Write-Output "Validated changes published locally and remotely."
