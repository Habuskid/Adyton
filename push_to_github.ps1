# Adyton GitHub Push Script (PowerShell)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       ADYTON - PUSH TO GITHUB (MAIN BRANCH)" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

$gitExe = "C:\Users\PC\AppData\Local\Programs\MinGit\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $gitCmd = Get-Command git -ErrorAction SilentlyContinue
    if ($gitCmd) {
        $gitExe = $gitCmd.Source
    } else {
        Write-Host "[ERROR] Git executable not found." -ForegroundColor Red
        return
    }
}

Set-Location "C:\Users\PC\Desktop\Adyton"

Write-Host "[1/3] Current local commit:" -ForegroundColor Yellow
& $gitExe log -n 1 --oneline

Write-Host "`n[2/3] Attempting push to origin main..." -ForegroundColor Yellow
& $gitExe push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Pushed successfully to https://github.com/Habuskid/Adyton" -ForegroundColor Green
    return
}

Write-Host "`n[INFO] GitHub requires authentication." -ForegroundColor Yellow
Write-Host "If using a GitHub Personal Access Token (PAT):" -ForegroundColor Cyan
$token = Read-Host "Paste your GitHub Token (or press Enter to skip)"

if ($token) {
    Write-Host "`n[3/3] Pushing with Token..." -ForegroundColor Yellow
    & $gitExe push "https://${token}@github.com/Habuskid/Adyton.git" main --force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[SUCCESS] Pushed successfully to https://github.com/Habuskid/Adyton" -ForegroundColor Green
    } else {
        Write-Host "`n[ERROR] Push failed. Please verify your token has 'repo' scope." -ForegroundColor Red
    }
}
