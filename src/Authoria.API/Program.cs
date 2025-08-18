using System.Text;
using Authoria.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Authoria.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// MVC Controllers
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// EF Core
builder.Services.AddDbContext<AuthoriaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer"))
);

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

var app = builder.Build();

// Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<TenantResolutionMiddleware>();
app.UseMiddleware<AuditLoggingMiddleware>();

app.MapControllers();

app.Run();
