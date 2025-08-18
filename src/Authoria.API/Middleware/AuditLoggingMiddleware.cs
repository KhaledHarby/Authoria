namespace Authoria.API.Middleware;

public class AuditLoggingMiddleware
{
	private readonly RequestDelegate _next;
	public AuditLoggingMiddleware(RequestDelegate next) => _next = next;

	public async Task Invoke(HttpContext context)
	{
		var start = DateTime.UtcNow;
		await _next(context);
		var duration = (long)(DateTime.UtcNow - start).TotalMilliseconds;
		context.Response.Headers["X-Request-Duration-Ms"] = duration.ToString();
	}
}



