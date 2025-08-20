using Authoria.Domain.Entities;

namespace Authoria.Application.Webhooks;

public interface IWebhookService
{
	Task<IReadOnlyList<WebhookSubscription>> ListAsync(CancellationToken ct = default);
	Task<WebhookSubscription> CreateAsync(WebhookSubscription s, CancellationToken ct = default);
}






