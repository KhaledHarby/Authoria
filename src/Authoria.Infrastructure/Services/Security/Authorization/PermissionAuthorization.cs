using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;

namespace Authoria.Infrastructure.Services.Security.Authorization;

public class PermissionRequirement : IAuthorizationRequirement
{
	public string Permission { get; }
	public PermissionRequirement(string permission) => Permission = permission;
}

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
	private readonly IDistributedCache _cache;
	public PermissionHandler(IDistributedCache cache) => _cache = cache;

	protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
	{
		if (context.User.Claims.Any(c => c.Type == "perm" && string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase)))
		{
			context.Succeed(requirement);
		}
		return Task.CompletedTask;
	}
}

public class PermissionPolicyProvider : IAuthorizationPolicyProvider
{
	public DefaultAuthorizationPolicyProvider FallbackPolicyProvider { get; }
	public PermissionPolicyProvider(IOptions<AuthorizationOptions> options) { FallbackPolicyProvider = new DefaultAuthorizationPolicyProvider(options); }

	public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => FallbackPolicyProvider.GetFallbackPolicyAsync();

	public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => FallbackPolicyProvider.GetDefaultPolicyAsync();

	public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
	{
		if (policyName.StartsWith("perm:", StringComparison.OrdinalIgnoreCase))
		{
			var perm = policyName.Substring("perm:".Length);
			var policy = new AuthorizationPolicyBuilder()
				.AddRequirements(new PermissionRequirement(perm))
				.Build();
			return Task.FromResult<AuthorizationPolicy?>(policy);
		}
		return FallbackPolicyProvider.GetPolicyAsync(policyName);
	}
}


