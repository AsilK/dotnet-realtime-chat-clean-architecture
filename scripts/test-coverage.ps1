$ErrorActionPreference = "Stop"

Write-Host "Running tests with coverage..."
Get-ChildItem -Recurse -Directory -Filter TestResults | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
if (Test-Path "coverage-report") {
    Remove-Item "coverage-report" -Recurse -Force
}
dotnet test ChatApp.sln -c Debug --collect:"XPlat Code Coverage"

$reports = Get-ChildItem -Recurse -Filter coverage.cobertura.xml | ForEach-Object { $_.FullName }
if (-not $reports -or $reports.Count -eq 0) {
    throw "No coverage files were generated."
}

if (-not (Test-Path ".tools/reportgenerator.exe")) {
    dotnet tool install dotnet-reportgenerator-globaltool --tool-path ./.tools
}

$joined = [string]::Join(';', $reports)
Write-Host "Generating merged coverage report..."
.\.tools\reportgenerator "-reports:$joined" "-targetdir:coverage-report" "-reporttypes:TextSummary;Html"

Write-Host "Coverage summary:"
Get-Content coverage-report/Summary.txt
