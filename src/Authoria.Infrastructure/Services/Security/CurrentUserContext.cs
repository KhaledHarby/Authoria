using System.Security.Claims;
using System.Linq;
using Authoria.Application.Abstractions;
using Microsoft.AspNetCore.Http;

namespace Authoria.Infrastructure.Services.Security;

public class CurrentUserContext : ICurrentUserContext
{
	public Guid? UserId { get; }
	public Guid? TenantId { get; }
	public IReadOnlyCollection<string> Roles { get; }
	public IReadOnlyCollection<string> Permissions { get; }

	public CurrentUserContext(IHttpContextAccessor accessor)
	{
		var user = accessor.HttpContext?.User;
		UserId = Guid.TryParse(user?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == ClaimTypes.Name || c.Type == ClaimTypes.Sid)?.Value, out var uid) ? uid : null;
		TenantId = Guid.TryParse(user?.FindFirst("tid")?.Value, out var tid) ? tid : null;
		Roles = user?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray() ?? Array.Empty<string>();
		Permissions = user?.FindAll("perm").Select(c => c.Value).ToArray() ?? Array.Empty<string>();
	}

	public bool HasPermission(string permission) => Permissions.Contains(permission, StringComparer.OrdinalIgnoreCase);
}


