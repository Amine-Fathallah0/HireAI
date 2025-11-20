param(
  [string]$FilePath = "./sample.pdf"
)

$api = 'http://localhost:8080'
if (-not (Test-Path $FilePath)) {
  Write-Error "Sample file not found: $FilePath"
  exit 1
}

Write-Host "Uploading $FilePath"
$resp = curl -s -F "file=@$FilePath;type=application/pdf" "$api/api/resume/upload?enhance=false"
Write-Host "Upload response:`n$resp"

$json = $resp | ConvertFrom-Json
if (-not $json.resume_id) {
  Write-Error "No resume_id returned"
  exit 1
}

Write-Host "Fetching parsed resume $($json.resume_id)"
curl "$api/api/resume/$($json.resume_id)" | ConvertFrom-Json | Format-List
