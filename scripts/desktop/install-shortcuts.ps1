# Instala atajos UniWai en el escritorio (Windows)
$ErrorActionPreference = "Stop"

$Desktop = [Environment]::GetFolderPath("Desktop")
$SourceDir = $PSScriptRoot
$Names = @(
    "UniWai-Modo-Desarrollo.ps1",
    "UniWai-Modo-Prueba.ps1",
    "UniWai-Apagar-Stack.ps1",
    "UniWai-Estado.ps1"
)

Write-Host ""
Write-Host "Instalando atajos UniWai en:" -ForegroundColor Cyan
Write-Host "  $Desktop" -ForegroundColor DarkGray
Write-Host ""

foreach ($name in $Names) {
    $src = Join-Path $SourceDir $name
    $dst = Join-Path $Desktop $name
    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "  OK  $name"
}

Write-Host ""
Write-Host "Listo." -ForegroundColor Green
Write-Host ""
Write-Host "  Desarrollar (codigo)  -> UniWai-Modo-Desarrollo.ps1"
Write-Host "  Probar CRM            -> UniWai-Modo-Prueba.ps1"
Write-Host "  Apagar todo           -> UniWai-Apagar-Stack.ps1"
Write-Host "  Ver estado            -> UniWai-Estado.ps1"
Write-Host ""
Read-Host "Pulsa Enter para cerrar"
