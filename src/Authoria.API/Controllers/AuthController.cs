using Microsoft.AspNetCore.Mvc;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
	[HttpGet("health")]
	public IActionResult Health() => Ok(new { status = "ok" });

	[HttpPost("login")]
	public IActionResult Login() => Ok(new { token = "stub", refreshToken = "stub" });
}



