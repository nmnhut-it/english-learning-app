# PowerShell script to convert vocabulary format in markdown files
# This converts: (type) - word - pronunciation
# To: - **word** : (type) /pronunciation/

$markdownPath = ".\markdown-files"

Write-Host "Converting vocabulary format in markdown files..." -ForegroundColor Green

# Get all markdown files recursively
$files = Get-ChildItem -Path $markdownPath -Filter "*.md" -Recurse

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    # Read file content
    $content = Get-Content $file.FullName -Raw
    
    # Count matches before conversion
    $matchesBefore = ([regex]::Matches($content, '(?m)^\(([^)]+)\)\s*-\s*([^-]+?)\s*-\s*(.+)$')).Count
    
    # Convert vocabulary format
    # Pattern: (type) - word - pronunciation
    # Replace with: - **word** : (type) /pronunciation/
    $newContent = $content -replace '(?m)^\(([^)]+)\)\s*-\s*([^-]+?)\s*-\s*(.+)$', '- **$2** : ($1) /$3/'
    
    # Count matches after conversion
    $matchesAfter = ([regex]::Matches($newContent, '(?m)^-\s*\*\*[^*]+\*\*\s*:')).Count
    
    # Only write if changes were made
    if ($newContent -ne $content) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "  Converted $matchesBefore vocabulary entries" -ForegroundColor Green
    } else {
        Write-Host "  No changes needed" -ForegroundColor Gray
    }
}

Write-Host "`nConversion complete!" -ForegroundColor Green
Write-Host "Please restart the backend server to see the changes." -ForegroundColor Cyan
