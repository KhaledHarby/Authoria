using System.Security.Claims;
using System.Linq;
using Authoria.Application.Abstractions;
using Microsoft.AspNetCore.Http;

namespace Authoria.Infrastructure.Services.Security;

public class CurrentUserContext : ICurrentUserContext
{
	public Guid? UserId { get; }
	public Guid? TenantId { get; }
	public Guid? ApplicationId { get; }
	public IReadOnlyCollection<Guid> ApplicationIds { get; }
	public IReadOnlyCollection<string> Roles { get; }
	public IReadOnlyCollection<string> Permissions { get; }

	public CurrentUserContext(IHttpContextAccessor accessor)
	{
		var http = accessor.HttpContext;
		var user = http?.User;
		UserId = Guid.TryParse(user?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == ClaimTypes.Name || c.Type == ClaimTypes.Sid)?.Value, out var uid) ? uid : null;
		TenantId = Guid.TryParse(user?.FindFirst("tid")?.Value, out var tid) ? tid : TryParseHeader(http, "X-Authoria-Tenant");

		var headerVal = http?.Request.Headers["X-Authoria-App"].ToString();
		var parsed = new List<Guid>();
		
		// If header is present, use it (even if empty - this means explicitly no app selected)
		if (http?.Request.Headers.ContainsKey("X-Authoria-App") == true)
		{
			if (!string.IsNullOrWhiteSpace(headerVal))
			{
				var headerAppIds = headerVal.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
				foreach (var s in headerAppIds)
				{
					if (Guid.TryParse(s, out var g)) parsed.Add(g);
				}
			}
		}
		else
		{
			// Fallback to JWT claims if no header is present
			var appIdClaims = user?.FindAll("aid").Select(c => c.Value) ?? Enumerable.Empty<string>();
			foreach (var s in appIdClaims)
			{
				if (Guid.TryParse(s, out var g)) parsed.Add(g);
			}
		}
		
		ApplicationIds = parsed.Distinct().ToArray();
		//ApplicationId = ApplicationIds.FirstOrDefault();

		Roles = user?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray() ?? Array.Empty<string>();
		Permissions = user?.FindAll("perm").Select(c => c.Value).ToArray() ?? Array.Empty<string>();
	}

	private static Guid? TryParseHeader(HttpContext? http, string header)
	{
		var val = http?.Request.Headers[header].ToString();
		return Guid.TryParse(val, out var id) ? id : null;
	}

	public bool HasPermission(string permission) => Permissions.Contains(permission, StringComparer.OrdinalIgnoreCase);
}


