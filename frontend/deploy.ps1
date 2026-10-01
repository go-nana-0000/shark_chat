# deploy.ps1

$dst_front_path = "C:\ftp_work\test02"

$dist_name = "dist"

Write-Output "Build start..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Abort copying."
    exit 1
}

Write-Output "Build success. Start copying..."

$src_base = (Get-Location).Path
$src_front_path = Join-Path $src_base $dist_name

Write-Output "copy start..."
Write-Output "src_front: $src_front_path"
Write-Output "dst_front: $dst_front_path"

Remove-Item $dst_front_path\* -Recurse -Force

robocopy $src_front_path $dst_front_path /E /R:2 /W:1
if ($LASTEXITCODE -gt 7) {
    Write-Error "Frontend copy failed. Robocopy exit code: $LASTEXITCODE"
    exit 1
}
Write-Output "Frontend copy completed"

# Write-Output "upload start..."
# # & "C:\Program Files (x86)\WinSCP\WinSCP.com" /script=upload.txt

# # --- .env 読み込み ---
# $envFile = ".env"

# if (Test-Path $envFile) {
#     Get-Content $envFile | ForEach-Object {
#         if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
#             $name = $matches[1].Trim()
#             $value = $matches[2].Trim()
#             [System.Environment]::SetEnvironmentVariable($name, $value)
#         }
#     }
# } else {
#     Write-Error ".env file not found"
#     exit 1
# }

# --- 変数使用 ---
# $ftpUser = $env:FTP_USER
# $ftpPass = $env:FTP_PASS
# $ftpHost = $env:FTP_HOST

# デバッグ（本番では消す）
# Write-Output "User: $ftpUser"

# --- WinSCP用コマンド生成例 ---
# $script = @"
# open ftp://$ftpUser`:$ftpPass@$ftpHost
# option batch abort
# option confirm off

# echo === CHECK PATH ===
# lpwd
# pwd

# lcd C:\ftp_work\test02
# cd /public_html/test02

# echo === SYNC START ===
# synchronize remote -delete

# exit
# "@

# $scriptPath = "upload_tmp.txt"
# $script | Out-File -Encoding ascii $scriptPath

# 実行（例）
# & "C:\Program Files (x86)\WinSCP\WinSCP.com" /script=$scriptPath

# 後処理（重要）
# Remove-Item $scriptPath

Write-Output "upload completed"
