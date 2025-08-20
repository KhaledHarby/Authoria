using Authoria.API.Middleware;
using Authoria.API.Swagger;
using Authoria.Application.Abstractions;
using Authoria.Application.Audit;
using Authoria.Application.Auth;
using Authoria.Application.Localization;
using Authoria.Application.Permissions;
using Authoria.Application.Roles;
using Authoria.Application.Users;
using Authoria.Application.Webhooks;
using Authoria.Infrastructure.Persistence;
using Authoria.Infrastructure.Services;
using Authoria.Infrastructure.Services.Audit;
using Authoria.Infrastructure.Services.Auth;
using Authoria.Infrastructure.Services.Localization;
using Authoria.Infrastructure.Services.Permissions;
using Authoria.Infrastructure.Services.Roles;
using Authoria.Infrastructure.Services.Security;
using Authoria.Infrastructure.Services.Security.Authorization;
using Authoria.Infrastructure.Services.Users;
using Authoria.Infrastructure.Services.Webhooks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Swagger/OpenAPI
builder.Services.AddAuthoriaSwagger();

// MVC Controllers
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// EF Core
string connstr = builder.Configuration.GetConnectionString("MSSQL");
Console.Clear();
Console.WriteLine($"Using connection string: {connstr}");
builder.Services.AddDbContext<AuthoriaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer"))
);


// Caching (for authorization handler deps)
builder.Services.AddDistributedMemoryCache();
builder.Services.AddHttpContextAccessor();

// CORS for local frontend
builder.Services.AddCors(options =>
{
	options.AddPolicy("LocalDev", p =>
		p.WithOrigins(
			"http://localhost:5173",  // Vite default
			"http://localhost:3000",  // React default
			"http://localhost:4173",  // Vite preview
			"http://127.0.0.1:5173",  // Alternative localhost
			"http://127.0.0.1:3000"   // Alternative localhost
		)
		 .AllowAnyHeader()
		 .AllowAnyMethod()
		 .AllowCredentials()
		 .WithExposedHeaders("X-Request-Duration-Ms"));
	
	// More permissive policy for development debugging
	options.AddPolicy("Development", p =>
		p.SetIsOriginAllowed(origin => true) // Allow any origin but compatible with credentials
		 .AllowAnyHeader()
		 .AllowAnyMethod()
		 .AllowCredentials()
		 .WithExposedHeaders("X-Request-Duration-Ms"));
});

// AuthN/Z
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"] ?? "change_me"))
        };
    });

builder.Services.AddAuthorization();

// DI
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<ILocalizationService, LocalizationService>();
builder.Services.AddScoped<IAuditQueryService, AuditQueryService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IWebhookService, WebhookService>();
builder.Services.AddScoped<ICurrentUserContext, CurrentUserContext>();
builder.Services.AddScoped<IDatabaseSeedService, DatabaseSeedService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

var app = builder.Build();

// Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapGet("/", () => Results.Redirect("/swagger"));
}
else
{
    app.MapGet("/", () => Results.Ok(new { status = "Authoria API running" }));
}

// Use appropriate CORS policy based on environment
if (app.Environment.IsDevelopment())
{
    app.UseCors("Development");
    Console.WriteLine("Using Development CORS policy (AllowAnyOrigin)");
}
else
{
    app.UseCors("LocalDev");
    Console.WriteLine("Using LocalDev CORS policy (specific origins)");
}

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<TenantResolutionMiddleware>();
app.UseMiddleware<AuditMiddleware>();

app.MapControllers();

// Seed database on startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var seedService = scope.ServiceProvider.GetRequiredService<IDatabaseSeedService>();
        await seedService.SeedAsync();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Failed to seed database. Application will continue without seeding.");
    }
}

app.Run();
