param(
    [string]$Connection = "Server=10.24.15.15;Database=Authoria;User ID=accela;Password=accela;Min Pool Size=50;TrustServerCertificate=True;"
)

Write-Host "Setting connection string: $Connection"
$env:ConnectionStrings__SqlServer = $Connection

Write-Host "Running database update..."
dotnet ef database update -p src/Authoria.Infrastructure/Authoria.Infrastructure.csproj -s src/Authoria.API/Authoria.API.csproj

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database updated successfully!" -ForegroundColor Green
} else {
    Write-Host "Database update failed!" -ForegroundColor Red
}


