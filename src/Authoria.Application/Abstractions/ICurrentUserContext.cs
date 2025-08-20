namespace Authoria.Application.Abstractions;

public interface ICurrentUserContext
{
	Guid? UserId { get; }
	Guid? TenantId { get; }
	Guid? ApplicationId { get; }
	IReadOnlyCollection<Guid> ApplicationIds { get; }
	IReadOnlyCollection<string> Roles { get; }
	IReadOnlyCollection<string> Permissions { get; }
	bool HasPermission(string permission);
}






