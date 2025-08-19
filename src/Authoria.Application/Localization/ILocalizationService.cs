using Authoria.Domain.Entities;
using Authoria.Application.Common;

namespace Authoria.Application.Localization;

public interface ILocalizationService
{
	Task<IReadOnlyList<LocalizationLabel>> ListAsync(CancellationToken ct = default);
	Task<LocalizationLabel> UpsertAsync(LocalizationLabel label, CancellationToken ct = default);
	Task<LocalizationLabel?> GetByIdAsync(Guid id, CancellationToken ct = default);
	Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
	Task<PaginationResponse<LocalizationLabel>> GetPaginatedAsync(PaginationRequest request, CancellationToken ct = default);
	Task<IReadOnlyList<LocalizationLabel>> SearchAsync(string searchTerm, string? language = null, CancellationToken ct = default);
	Task<IReadOnlyList<string>> GetSupportedLanguagesAsync(CancellationToken ct = default);
	Task<Dictionary<string, string>> GetTranslationsForLanguageAsync(string language, CancellationToken ct = default);
	Task<IReadOnlyList<LocalizationLabel>> BulkUpsertAsync(IEnumerable<LocalizationLabel> labels, CancellationToken ct = default);
	Task<bool> ImportFromJsonAsync(string language, Dictionary<string, string> translations, Guid? tenantId = null, CancellationToken ct = default);
	Task<Dictionary<string, Dictionary<string, string>>> ExportAllLanguagesAsync(CancellationToken ct = default);
	Task<bool> ValidateTranslationsAsync(string language, CancellationToken ct = default);
	Task<IReadOnlyList<string>> GetMissingTranslationsAsync(string language, CancellationToken ct = default);
}




