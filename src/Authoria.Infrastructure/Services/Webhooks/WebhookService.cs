using Authoria.Application.Abstractions;
using Authoria.Application.Webhooks;
using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Authoria.Infrastructure.Services.Webhooks;

public class WebhookService : IWebhookService
{
	private readonly AuthoriaDbContext _db;
	private readonly ICurrentUserContext _current;
	public WebhookService(AuthoriaDbContext db, ICurrentUserContext current) { _db = db; _current = current; }

	public async Task<IReadOnlyList<WebhookSubscription>> ListAsync(CancellationToken ct = default)
	{
		if (!_current.HasPermission("webhook.view")) throw new UnauthorizedAccessException("Missing permission: webhook.view");
		return await _db.WebhookSubscriptions.AsNoTracking().ToListAsync(ct);
	}

	public async Task<WebhookSubscription> CreateAsync(WebhookSubscription s, CancellationToken ct = default)
	{
		if (!_current.HasPermission("webhook.create")) throw new UnauthorizedAccessException("Missing permission: webhook.create");
		s.Id = s.Id == Guid.Empty ? Guid.NewGuid() : s.Id;
		_db.WebhookSubscriptions.Add(s);
		await _db.SaveChangesAsync(ct);
		return s;
	}
}


