$ErrorActionPreference = "SilentlyContinue"

$repoRoot = Split-Path -Parent $PSScriptRoot
$portsToClear = @(3000, 3001, 5000)

foreach ($port in $portsToClear) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen
  foreach ($listener in $listeners) {
    Stop-Process -Id $listener.OwningProcess -Force
  }
}

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$repoRoot\backend'; npm run dev"
)

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "`$env:PORT='3001'; Set-Location '$repoRoot\frontend'; npm start"
)

Write-Output 'Local ITC Archive started on http://localhost:3001/itc-archive-pro'
