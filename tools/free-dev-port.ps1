# free-dev-port.ps1  [CA-094.03]
#
# Giải phóng port dev (5173, 51730) an toàn trên Windows:
#   1. Tìm PID đang LISTEN trên các port.
#   2. Xác minh CommandLine / ExecutablePath thuộc Campus Assistant.
#   3. Chỉ Stop-Process nếu vượt qua cả hai lớp kiểm tra.
#
# Chạy: powershell -ExecutionPolicy Bypass -File tools\free-dev-port.ps1

$ErrorActionPreference = "SilentlyContinue"

# ─── Cấu hình ────────────────────────────────────────────────────────────────

$DevPorts = @(5173, 51730)

$ProjectMarkers = @(
  "campus-assistant-local",
  "KI-M-TH-PH-N-M-M-C4T4-Bot-Edu",
  "campus_assistant"
)

$AllowedProcessNames = @("node", "npm", "npx", "cargo", "campus-assistant-local")

# ─── Helper ──────────────────────────────────────────────────────────────────

function Test-BelongsToProject([int]$Pid) {
  $wmiProc = Get-WmiObject Win32_Process -Filter "ProcessId=$Pid" -ErrorAction SilentlyContinue
  if ($null -eq $wmiProc) { return $false }

  $cmdline  = ($wmiProc.CommandLine  ?? "").ToLower()
  $exePath  = ($wmiProc.ExecutablePath ?? "").ToLower()

  foreach ($marker in $ProjectMarkers) {
    $m = $marker.ToLower()
    if ($cmdline.Contains($m) -or $exePath.Contains($m)) { return $true }
  }
  return $false
}

# ─── Main ────────────────────────────────────────────────────────────────────

$freed = 0

foreach ($port in $DevPorts) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

  if (-not $connections) {
    Write-Host "[free-dev-port] Port ${port}: free."
    continue
  }

  $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 }

  foreach ($pid in $pids) {
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($null -eq $proc) { continue }

    $name = $proc.ProcessName.ToLower()

    if ($name -notin $AllowedProcessNames) {
      Write-Warning "[free-dev-port] Port ${port}: PID $pid ($name) — không phải Node/Cargo, bỏ qua."
      continue
    }

    if (-not (Test-BelongsToProject $pid)) {
      Write-Warning "[free-dev-port] Port ${port}: PID $pid ($name) — không phải Campus Assistant, bỏ qua."
      continue
    }

    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Write-Host "[free-dev-port] Port ${port}: đã kill PID $pid ($name). ✓"
    $freed++
  }
}

if ($freed -eq 0) {
  Write-Host "[free-dev-port] Không có tiến trình nào cần giải phóng."
}
