using Authoria.Application.Auth.Dtos;

namespace Authoria.Application.Auth;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request, string? userAgent, string? ipAddress, CancellationToken ct = default);
    Task<LoginResponse?> RefreshAsync(RefreshTokenRequest request, CancellationToken ct = default);
    Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
}


