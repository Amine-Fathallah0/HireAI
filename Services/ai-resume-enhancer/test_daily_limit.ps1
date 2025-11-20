# Test daily rate limiting (10 enhancements per day)
# Tests section enhancement endpoint with 12 consecutive calls

$UserId = "test@example.com"
$ResumeId = "test-resume-001"  # Replace with actual resume ID if needed
$Endpoint = "http://localhost:8000/api/resumes/$ResumeId/enhance"

$Body = @{
    section = "summary"
    text = "Experienced student developer contributing to open-source projects using Python and React."
    context = @{ 
        job_title = "Junior Developer"
        industry = "software"
        section_index = 0 
    }
} | ConvertTo-Json -Depth 4

Write-Host "Testing Daily Rate Limit (10/day) on Section Enhancement Endpoint" -ForegroundColor Cyan
Write-Host "User: $UserId" -ForegroundColor Cyan
Write-Host "Resume: $ResumeId" -ForegroundColor Cyan
Write-Host "Endpoint: $Endpoint`n" -ForegroundColor Cyan

$SuccessCount = 0
$LimitReached = $false

for ($i = 1; $i -le 12; $i++) {
    Write-Host "Attempt $i of 12..." -NoNewline
    
    try {
        $resp = Invoke-RestMethod -Uri $Endpoint -Method POST `
            -Headers @{ "x-user-id" = $UserId } `
            -Body $Body `
            -ContentType "application/json"
        
        $SuccessCount++
        Write-Host " OK" -ForegroundColor Green
        Write-Host "  ATS Before: $($resp.ats_score_before.score.ToString('F2'))" -ForegroundColor Gray
        Write-Host "  ATS After: $($resp.ats_score_after.score.ToString('F2'))" -ForegroundColor Gray
        Write-Host "  Confidence: $($resp.confidence)" -ForegroundColor Gray
        Write-Host "  Keywords Added: $($resp.keywords_added.Count)" -ForegroundColor Gray
    }
    catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode -eq 429) {
            Write-Host " RATE LIMITED" -ForegroundColor Yellow
            $LimitReached = $true
            
            try {
                $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "`nRate Limit Response:" -ForegroundColor Yellow
                Write-Host "  Message: $($errorDetail.detail)" -ForegroundColor Yellow
                if ($errorDetail.headers.'Retry-After') {
                    $retryAfter = [int]$errorDetail.headers.'Retry-After'
                    $hours = [math]::Floor($retryAfter / 3600)
                    Write-Host "  Retry After: $retryAfter seconds (~$hours hours)" -ForegroundColor Yellow
                }
            }
            catch {
                Write-Host "  Raw Error: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
            }
            break
        }
        else {
            Write-Host " ERROR" -ForegroundColor Red
            Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
            
            # Check if resume doesn't exist
            if ($_.Exception.Message -like "*404*" -or $_.Exception.Message -like "*Not Found*") {
                Write-Host "`nResume ID '$ResumeId' not found!" -ForegroundColor Red
                Write-Host "Create a test resume first or update `$ResumeId variable." -ForegroundColor Red
                break
            }
        }
    }
    
    Start-Sleep -Milliseconds 500  # Small delay between requests
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Successful requests: $SuccessCount" -ForegroundColor $(if ($SuccessCount -eq 10) { "Green" } else { "Yellow" })
Write-Host "Rate limited: $LimitReached" -ForegroundColor $(if ($LimitReached) { "Yellow" } else { "Red" })

# Check Redis counter
Write-Host "`n=== Redis Counter Check ===" -ForegroundColor Cyan
try {
    $today = Get-Date -Format "yyyy:M:d"
    $dailyKey = "rate_limit:daily:${UserId}:$today"
    $count = docker exec ms-redis redis-cli GET $dailyKey 2>$null
    
    if ($count) {
        Write-Host "Daily usage for $UserId (today): $count/10" -ForegroundColor Cyan
    } else {
        Write-Host "No Redis key found (rate limiting may not be working)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Could not check Redis (is Docker running?)" -ForegroundColor Yellow
}

Write-Host "`nExpected behavior: 10 successful requests, then 429 on attempt 11" -ForegroundColor Gray
