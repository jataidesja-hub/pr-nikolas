Set-Location $PSScriptRoot
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
$limite = 80MB
$bk = Join-Path (Split-Path $PSScriptRoot) 'NIKOLAS_original'

Get-ChildItem midia -File | Where-Object { $_.Length -gt $limite } | ForEach-Object {
    $f = $_
    if ($f.Extension -notmatch '^\.(mp4|mov|m4v|webm)$') { Write-Host "ATENCAO: $($f.Name) maior que 80MB e nao e video; reduza manualmente."; return }
    if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { Write-Host "ffmpeg nao encontrado: winget install Gyan.FFmpeg"; return }
    Write-Host "Comprimindo $($f.Name)..."
    New-Item -ItemType Directory -Force $bk | Out-Null
    Move-Item $f.FullName $bk -Force
    $out = Join-Path $f.DirectoryName ($f.BaseName + '.mp4')
    ffmpeg -y -loglevel error -i (Join-Path $bk $f.Name) -vf "scale='min(1280,iw)':-2" -c:v libx264 -crf 28 -preset fast -c:a aac -b:a 96k -movflags +faststart $out
}

git add -A
git commit -m ("Atualizacao de midia " + (Get-Date -Format 'dd/MM/yyyy HH:mm'))
git push
Write-Host "`nPublicado. O Vercel atualiza em ~1 minuto."
