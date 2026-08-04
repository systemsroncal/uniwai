# UniWai — funciones compartidas para atajos de escritorio
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..\..")

function Invoke-UniWaiStack {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Mode
    )

    Set-Location $ProjectRoot
    Write-Host ""
    Write-Host "UniWai → stack:$Mode" -ForegroundColor Cyan
    Write-Host "Proyecto: $ProjectRoot" -ForegroundColor DarkGray
    Write-Host ""

    if (Get-Command bun -ErrorAction SilentlyContinue) {
        bun run "stack:$Mode"
    } else {
        node (Join-Path $ProjectRoot "scripts\stack.mjs") $Mode
    }

    if ($Mode -ne "status") {
        Write-Host ""
        Read-Host "Pulsa Enter para cerrar"
    }
}
