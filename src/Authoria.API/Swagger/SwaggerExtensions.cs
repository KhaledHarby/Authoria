using Microsoft.OpenApi.Models;

namespace Authoria.API.Swagger;

public static class SwaggerExtensions
{
	public static IServiceCollection AddAuthoriaSwagger(this IServiceCollection services)
	{
		services.AddEndpointsApiExplorer();
		services.AddSwaggerGen(c =>
		{
			c.SwaggerDoc("v1", new OpenApiInfo { Title = "Authoria API", Version = "v1" });
			var securityScheme = new OpenApiSecurityScheme
			{
				Name = "Authorization",
				Description = "Enter JWT Bearer token",
				In = ParameterLocation.Header,
				Type = SecuritySchemeType.Http,
				Scheme = "bearer",
				BearerFormat = "JWT",
			};
			c.AddSecurityDefinition("Bearer", securityScheme);
			c.AddSecurityRequirement(new OpenApiSecurityRequirement
			{
				{
					new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
					Array.Empty<string>()
				}
			});
		});
		return services;
	}
}


