using System.Diagnostics;

namespace Authoria.API.Middleware;

public class AuditLoggingMiddleware
{
	private readonly RequestDelegate _next;
	public AuditLoggingMiddleware(RequestDelegate next) => _next = next;

    public async Task Invoke(HttpContext context)
    {
        var sw = Stopwatch.StartNew();

        // Register before the response starts
        context.Response.OnStarting(() =>
        {
            // Will run right before headers are sent
            var ms = ((long)sw.Elapsed.TotalMilliseconds).ToString();
            // Use Append to avoid overwriting if someone already set it
            context.Response.Headers.Append("X-Request-Duration-Ms", ms);
            return Task.CompletedTask;
        });

        await _next(context);
    }
}



