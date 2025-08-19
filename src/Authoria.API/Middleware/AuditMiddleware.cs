using Authoria.Application.Audit;
using System.Diagnostics;

namespace Authoria.API.Middleware;

public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditMiddleware> _logger;

    public AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IAuditService auditService)
    {
        var stopwatch = Stopwatch.StartNew();
        var originalBodyStream = context.Response.Body;

        try
        {
            using var memoryStream = new MemoryStream();
            context.Response.Body = memoryStream;

            await _next(context);

            stopwatch.Stop();

            // Log the API call
            await auditService.LogApiCallAsync(
                method: context.Request.Method,
                path: context.Request.Path,
                statusCode: context.Response.StatusCode,
                durationMs: stopwatch.ElapsedMilliseconds,
                ipAddress: GetClientIpAddress(context),
                userAgent: context.Request.Headers["User-Agent"].FirstOrDefault()
            );

            // Copy the response back to the original stream
            memoryStream.Position = 0;
            await memoryStream.CopyToAsync(originalBodyStream);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Error in audit middleware");

            // Log the failed API call
            await auditService.LogApiCallAsync(
                method: context.Request.Method,
                path: context.Request.Path,
                statusCode: 500,
                durationMs: stopwatch.ElapsedMilliseconds,
                ipAddress: GetClientIpAddress(context),
                userAgent: context.Request.Headers["User-Agent"].FirstOrDefault()
            );

            throw;
        }
        finally
        {
            context.Response.Body = originalBodyStream;
        }
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        var forwardedHeader = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedHeader))
        {
            return forwardedHeader.Split(',')[0].Trim();
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
    }
}
