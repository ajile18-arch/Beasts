<#
.SYNOPSIS
Bumps the game version by one in the hundredths place (e.g. 1.00 -> 1.01).
Used whenever a new release is prepared to be uploaded to GitHub.
#>

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $repoRoot -or -not (Test-Path "$repoRoot\js\game.js")) {
    $repoRoot = (Get-Location).Path
}

$gameJsPath = Join-Path $repoRoot "js\game.js"
$indexHtmlPath = Join-Path $repoRoot "index.html"

if (-not (Test-Path $gameJsPath) -or -not (Test-Path $indexHtmlPath)) {
    Write-Error "Could not find js\game.js or index.html in $repoRoot"
    exit 1
}

$gameJs = Get-Content $gameJsPath -Raw -Encoding UTF8
$html = Get-Content $indexHtmlPath -Raw -Encoding UTF8

$match = [regex]::Match($gameJs, "this\.VERSION\s*=\s*'(\d+)\.(\d+)';")
if (-not $match.Success) {
    Write-Error "Could not parse current version from $gameJsPath"
    exit 1
}

$major = [int]$match.Groups[1].Value
$minor = [int]$match.Groups[2].Value
$oldVersion = "{0}.{1:D2}" -f $major, $minor

$newMinor = $minor + 1
$newVersion = "{0}.{1:D2}" -f $major, $newMinor

Write-Host "Bumping version from $oldVersion to $newVersion..." -ForegroundColor Cyan

# Update js/game.js
$newGameJs = $gameJs -replace "this\.VERSION\s*=\s*'[^']+';", "this.VERSION = '$newVersion';"
[System.IO.File]::WriteAllText($gameJsPath, $newGameJs, [System.Text.Encoding]::UTF8)

# Update index.html
$newHtml = [regex]::Replace($html, 'id="game-version">v[^<]+<', "id=`"game-version`">v$newVersion<")
$newHtml = [regex]::Replace($newHtml, 'Tactical Arena v\d+\.\d+ initialized', "Tactical Arena v$newVersion initialized")
[System.IO.File]::WriteAllText($indexHtmlPath, $newHtml, [System.Text.Encoding]::UTF8)

Write-Host "Successfully updated version to $newVersion in index.html and js/game.js!" -ForegroundColor Green
