using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Authoria.Infrastructure.Persistence;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AuthoriaDbContext>
{
	public AuthoriaDbContext CreateDbContext(string[] args)
	{
		var config = new ConfigurationBuilder()
			.AddJsonFile("../../Authoria.API/appsettings.json", optional: true)
			.AddJsonFile("../../Authoria.API/appsettings.Development.json", optional: true)
			.AddEnvironmentVariables()
			.Build();

		var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__SqlServer")
			?? config.GetConnectionString("SqlServer")
			?? "Server=10.24.15.15;Database=Authoria;User ID=accela;Password=accela;Min Pool Size=50;TrustServerCertificate=True;";

		var optionsBuilder = new DbContextOptionsBuilder<AuthoriaDbContext>();
		optionsBuilder.UseSqlServer(connectionString);

		return new AuthoriaDbContext(optionsBuilder.Options);
	}
}



