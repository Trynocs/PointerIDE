[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$NodeVersion = (Get-Content (Join-Path $Root '.nvmrc') -Raw).Trim().TrimStart('v')
$NodeDir = Join-Path $Root ".codex-tools\node-v$NodeVersion-win-x64"
$NpmCmd = Join-Path $NodeDir 'npm.cmd'

if (-not (Test-Path $NpmCmd)) {
	$npmOnPath = Get-Command npm.cmd -ErrorAction SilentlyContinue
	$nodeOnPath = Get-Command node.exe -ErrorAction SilentlyContinue
	if ($npmOnPath -and $nodeOnPath) {
		$NpmCmd = $npmOnPath.Source
		$NodeDir = Split-Path $npmOnPath.Source -Parent
	} else {
		throw "Node.js/npm not found. Expected local runtime at $NodeDir or on PATH."
	}
}

$env:PATH = "$NodeDir;$env:PATH"

function Stop-ProcessTree {
	param([int]$ParentId)
	$children = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
		Where-Object { $_.ParentProcessId -eq $ParentId }
	foreach ($child in $children) {
		Stop-ProcessTree -ParentId $child.ProcessId
		Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue
	}
}

$killed = $false

Write-Host ''
Write-Host '[Pointer] Stopping all dev processes...' -ForegroundColor Yellow
Write-Host ''

$electronExe = Join-Path $Root '.build\electron\Pointer.exe'
$pointerProcs = Get-Process -Name 'Pointer' -ErrorAction SilentlyContinue |
	Where-Object { $_.Path -eq $electronExe }
if ($pointerProcs) {
	foreach ($proc in $pointerProcs) {
		Write-Host "  Killing Pointer.exe (PID $($proc.Id))" -ForegroundColor Gray
		Stop-ProcessTree -ParentId $proc.Id
		Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
		$killed = $true
	}
}

$killScripts = @(
	'kill-watch-client-transpiled',
	'kill-watch-clientd',
	'kill-watch-extensionsd',
	'kill-watch-copilotd',
	'kill-watchd'
)

Push-Location $Root
try {
	foreach ($script in $killScripts) {
		& $NpmCmd run $script 2>$null | Out-Null
	}
} finally {
	Pop-Location
}

$escapedRoot = [regex]::Escape($Root)
$resolvedNodeExe = Join-Path $NodeDir 'node.exe'
if (Test-Path $resolvedNodeExe) {
	$resolvedNodeExe = (Resolve-Path $resolvedNodeExe).Path
}
$nodeProcs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
	Where-Object {
		$_.CommandLine -and
		($_.CommandLine -match $escapedRoot -or $_.ExecutablePath -eq $resolvedNodeExe) -and
		($_.CommandLine -match 'deemon' -or $_.CommandLine -match 'watch-client-transpile' -or ($_.CommandLine -match 'build[\\/]next[\\/]index\.ts' -and $_.CommandLine -match '--watch') -or $_.CommandLine -match 'gulp.*watch')
	}

if ($nodeProcs) {
	foreach ($proc in $nodeProcs) {
		$cmdLine = if ($proc.CommandLine.Length -gt 100) { $proc.CommandLine.Substring(0, 100) + '...' } else { $proc.CommandLine }
		Write-Host "  Killing orphaned node.exe (PID $($proc.ProcessId)): $cmdLine" -ForegroundColor Gray
		Stop-ProcessTree -ParentId $proc.ProcessId
		Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
		$killed = $true
	}
}

Start-Sleep -Seconds 1

$finalCheck = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
	Where-Object {
		$_.CommandLine -match $escapedRoot -and $_.CommandLine -match 'deemon'
	}
if ($finalCheck) {
	foreach ($proc in $finalCheck) {
		Write-Host "  Force-killing remaining deemon (PID $($proc.ProcessId))" -ForegroundColor Gray
		Stop-ProcessTree -ParentId $proc.ProcessId
		Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
		$killed = $true
	}
}

Write-Host ''
if ($killed) {
	Write-Host '[Pointer] All dev processes stopped.' -ForegroundColor Green
} else {
	Write-Host '[Pointer] No running dev processes found.' -ForegroundColor DarkGray
}
