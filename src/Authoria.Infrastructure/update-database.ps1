param(
	[string]$Target
)

if ($Target) {
	dotnet ef database update $Target `
		-p ../Authoria.Infrastructure/Authoria.Infrastructure.csproj `
		-s ../Authoria.API/Authoria.API.csproj
} else {
	dotnet ef database update `
		-p ../Authoria.Infrastructure/Authoria.Infrastructure.csproj `
		-s ../Authoria.API/Authoria.API.csproj
}


