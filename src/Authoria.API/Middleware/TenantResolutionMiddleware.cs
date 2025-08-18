namespace Authoria.API.Middleware;

public class TenantResolutionMiddleware
{
	private readonly RequestDelegate _next;
	public TenantResolutionMiddleware(RequestDelegate next) => _next = next;

	public async Task Invoke(HttpContext context)
	{
		var tenantId = context.Request.Headers["X-Authoria-Tenant"].ToString();
		if (!string.IsNullOrWhiteSpace(tenantId))
		{
			context.Items["TenantId"] = tenantId;
		}
		await _next(context);
	}
}



