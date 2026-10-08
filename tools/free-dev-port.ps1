$ErrorActionPreference = "SilentlyContinue"

$connections = Get-NetTCPConnection -LocalPort 5173 -State Listen
$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 }

foreach ($processId in $processIds) {
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($null -ne $process -and $process.ProcessName -in @("node", "npm", "cargo", "campus-assistant-local")) {
    Stop-Process -Id $processId -Force
  }
}

