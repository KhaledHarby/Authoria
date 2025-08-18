param(
	[string]$Name
)

if (-not $Name) {
	Write-Host "Usage: ./add-migration.ps1 <Name>" -ForegroundColor Yellow
	exit 1
}

dotnet ef migrations add $Name `
	-p ../Authoria.Infrastructure/Authoria.Infrastructure.csproj `
	-s ../Authoria.API/Authoria.API.csproj `
	-o Persistence/Migrations


