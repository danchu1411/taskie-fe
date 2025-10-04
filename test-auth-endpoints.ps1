# Authentication Endpoints Performance Test (PowerShell version)
# Tests /auth/login and /auth/google endpoints with mock credentials

$BASE_URL = "http://localhost:3000"
$API_BASE = "$BASE_URL/api"
$ITERATIONS = 10
$TIMEOUT = 10

# Mock credentials
$LOGIN_DATA = @{
    email = "test@example.com"
    password = "testpassword123"
    remember = $true
} | ConvertTo-Json

$GOOGLE_DATA = @{
    mock = @{
        sub = "mock-1234567890"
        email = "mockuser@example.com"
        name = "Mock User"
    }
    remember = $true
} | ConvertTo-Json

Write-Host "🚀 Starting Authentication Endpoints Performance Test" -ForegroundColor Blue
Write-Host "🌐 Base URL: $BASE_URL" -ForegroundColor Blue
Write-Host "⏱️  Timeout: ${TIMEOUT}s" -ForegroundColor Blue
Write-Host "🔄 Iterations: $ITERATIONS" -ForegroundColor Blue

# Function to measure response time
function Measure-Endpoint {
    param(
        [string]$Url,
        [string]$Data,
        [string]$TestName
    )
    
    Write-Host "`n🧪 Testing $TestName..." -ForegroundColor Yellow
    Write-Host "📍 URL: $Url" -ForegroundColor Yellow
    Write-Host "🔄 Running $ITERATIONS iterations...`n" -ForegroundColor Yellow
    
    $results = @()
    $successCount = 0
    $totalTime = 0
    
    for ($i = 1; $i -le $ITERATIONS; $i++) {
        Write-Host "⏳ Request $i/$ITERATIONS... " -NoNewline
        
        $startTime = Get-Date
        
        try {
            $response = Invoke-RestMethod -Uri $Url -Method POST -Body $Data -ContentType "application/json" -TimeoutSec $TIMEOUT
            $endTime = Get-Date
            $responseTime = ($endTime - $startTime).TotalMilliseconds
            
            Write-Host "✅ $([math]::Round($responseTime, 2))ms" -ForegroundColor Green
            $successCount++
            $totalTime += $responseTime
            $results += $responseTime
        }
        catch {
            $endTime = Get-Date
            $responseTime = ($endTime - $startTime).TotalMilliseconds
            Write-Host "❌ $([math]::Round($responseTime, 2))ms ($($_.Exception.Message))" -ForegroundColor Red
        }
        
        # Small delay between requests
        Start-Sleep -Milliseconds 100
    }
    
    # Calculate statistics
    if ($successCount -gt 0) {
        $avgTime = $totalTime / $successCount
        $successRate = ($successCount / $ITERATIONS) * 100
        $minTime = ($results | Measure-Object -Minimum).Minimum
        $maxTime = ($results | Measure-Object -Maximum).Maximum
        
        # Calculate median
        $sortedResults = $results | Sort-Object
        $medianIndex = [math]::Floor($successCount / 2)
        $medianTime = $sortedResults[$medianIndex]
        
        Write-Host "`n📊 $TestName Results:" -ForegroundColor Blue
        Write-Host "├─ Success Rate: $([math]::Round($successRate, 1))%" -ForegroundColor Blue
        Write-Host "├─ Total Requests: $ITERATIONS" -ForegroundColor Blue
        Write-Host "├─ Successful: $successCount" -ForegroundColor Blue
        Write-Host "├─ Average Response Time: $([math]::Round($avgTime, 2))ms" -ForegroundColor Blue
        Write-Host "├─ Median Response Time: $([math]::Round($medianTime, 2))ms" -ForegroundColor Blue
        Write-Host "├─ Min Response Time: $([math]::Round($minTime, 2))ms" -ForegroundColor Blue
        Write-Host "└─ Max Response Time: $([math]::Round($maxTime, 2))ms" -ForegroundColor Blue
        
        # Performance assessment
        if ($avgTime -lt 100) {
            Write-Host "🚀 Performance: Excellent (< 100ms)" -ForegroundColor Green
        }
        elseif ($avgTime -lt 300) {
            Write-Host "✅ Performance: Good (< 300ms)" -ForegroundColor Green
        }
        elseif ($avgTime -lt 1000) {
            Write-Host "⚠️  Performance: Acceptable (< 1s)" -ForegroundColor Yellow
        }
        else {
            Write-Host "🐌 Performance: Slow (> 1s)" -ForegroundColor Red
        }
        
        return @{
            AvgTime = $avgTime
            SuccessRate = $successRate
        }
    }
    else {
        Write-Host "`n❌ All requests failed for $TestName" -ForegroundColor Red
        return @{
            AvgTime = 0
            SuccessRate = 0
        }
    }
}

# Test 1: Login endpoint
$loginResults = Measure-Endpoint -Url "$API_BASE/auth/login" -Data $LOGIN_DATA -TestName "Login Endpoint"

# Test 2: Google auth endpoint
$googleResults = Measure-Endpoint -Url "$API_BASE/auth/google" -Data $GOOGLE_DATA -TestName "Google Auth Endpoint"

# Overall assessment
Write-Host "`n📈 Overall Assessment:" -ForegroundColor Blue
$overallAvg = ($loginResults.AvgTime + $googleResults.AvgTime) / 2
$overallSuccess = ($loginResults.SuccessRate + $googleResults.SuccessRate) / 2

Write-Host "├─ Overall Average Response Time: $([math]::Round($overallAvg, 2))ms" -ForegroundColor Blue
Write-Host "├─ Overall Success Rate: $([math]::Round($overallSuccess, 1))%" -ForegroundColor Blue
Write-Host "└─ Test Environment: $BASE_URL" -ForegroundColor Blue

# Local development limitations
if ($BASE_URL -like "*localhost*") {
    Write-Host "`n⚠️  Local Development Limitations:" -ForegroundColor Yellow
    Write-Host "├─ Results may not reflect production performance" -ForegroundColor Yellow
    Write-Host "├─ Network latency is minimal (localhost)" -ForegroundColor Yellow
    Write-Host "├─ Database queries may be faster (local DB)" -ForegroundColor Yellow
    Write-Host "├─ No CDN or load balancing effects" -ForegroundColor Yellow
    Write-Host "└─ Consider testing with production-like data volumes" -ForegroundColor Yellow
}

Write-Host "`n✅ Performance test completed!" -ForegroundColor Green
