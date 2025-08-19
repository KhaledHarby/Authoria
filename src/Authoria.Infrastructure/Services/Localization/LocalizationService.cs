using Authoria.Application.Abstractions;
using Authoria.Application.Localization;
using Authoria.Application.Common;
using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace Authoria.Infrastructure.Services.Localization;

public class LocalizationService : ILocalizationService
{
	private readonly AuthoriaDbContext _db;
	private readonly ICurrentUserContext _current;
	
	public LocalizationService(AuthoriaDbContext db, ICurrentUserContext current) 
	{ 
		_db = db; 
		_current = current; 
	}

	public async Task<IReadOnlyList<LocalizationLabel>> ListAsync(CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.view")) 
			throw new UnauthorizedAccessException("Missing permission: localization.view");
		
		return await _db.LocalizationLabels
			.AsNoTracking()
			.OrderBy(l => l.Language)
			.ThenBy(l => l.Key)
			.ToListAsync(ct);
	}

	public async Task<LocalizationLabel> UpsertAsync(LocalizationLabel label, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.upsert")) 
			throw new UnauthorizedAccessException("Missing permission: localization.upsert");
		
		if (label.Id == Guid.Empty) 
			label.Id = Guid.NewGuid();
		
		_db.LocalizationLabels.Update(label);
		await _db.SaveChangesAsync(ct);
		return label;
	}

	public async Task<LocalizationLabel?> GetByIdAsync(Guid id, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.view")) 
			throw new UnauthorizedAccessException("Missing permission: localization.view");
		
		return await _db.LocalizationLabels
			.AsNoTracking()
			.FirstOrDefaultAsync(l => l.Id == id, ct);
	}

	public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.delete")) 
			throw new UnauthorizedAccessException("Missing permission: localization.delete");
		
		var label = await _db.LocalizationLabels.FindAsync(new object[] { id }, ct);
		if (label == null) return false;
		
		_db.LocalizationLabels.Remove(label);
		await _db.SaveChangesAsync(ct);
		return true;
	}

	public async Task<PaginationResponse<LocalizationLabel>> GetPaginatedAsync(PaginationRequest request, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.view")) 
			throw new UnauthorizedAccessException("Missing permission: localization.view");
		
		var query = _db.LocalizationLabels.AsNoTracking();
		
		// Apply search filter
		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			var searchTerm = request.SearchTerm.ToLower();
			query = query.Where(l => 
				l.Key.ToLower().Contains(searchTerm) || 
				l.Value.ToLower().Contains(searchTerm) ||
				l.Language.ToLower().Contains(searchTerm));
		}
		
		// Apply language filter - check if search term contains language code
		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			var searchTerm = request.SearchTerm.ToLower();
			// Check if search term looks like a language code (2-3 characters)
			if (searchTerm.Length <= 3 && searchTerm.All(char.IsLetter))
			{
				query = query.Where(l => l.Language.ToLower() == searchTerm);
			}
		}
		
		// Apply sorting
		var sortBy = request.SortBy?.ToLower() ?? "language";
		var sortDirection = request.SortDirection?.ToLower() ?? "asc";
		
		query = sortBy switch
		{
			"key" => sortDirection == "desc" ? query.OrderByDescending(l => l.Key) : query.OrderBy(l => l.Key),
			"value" => sortDirection == "desc" ? query.OrderByDescending(l => l.Value) : query.OrderBy(l => l.Value),
			"language" => sortDirection == "desc" ? query.OrderByDescending(l => l.Language) : query.OrderBy(l => l.Language),
			_ => query.OrderBy(l => l.Language).ThenBy(l => l.Key)
		};
		
		var totalCount = await query.CountAsync(ct);
		var items = await query
			.Skip((request.Page - 1) * request.PageSize)
			.Take(request.PageSize)
			.ToListAsync(ct);
		
		return new PaginationResponse<LocalizationLabel>
		{
			Items = items,
			TotalCount = totalCount,
			Page = request.Page,
			PageSize = request.PageSize,
			TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize),
			HasNextPage = request.Page * request.PageSize < totalCount,
			HasPreviousPage = request.Page > 1
		};
	}

	public async Task<IReadOnlyList<LocalizationLabel>> SearchAsync(string searchTerm, string? language = null, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.view")) 
			throw new UnauthorizedAccessException("Missing permission: localization.view");
		
		var query = _db.LocalizationLabels.AsNoTracking();
		
		if (!string.IsNullOrWhiteSpace(searchTerm))
		{
			var term = searchTerm.ToLower();
			query = query.Where(l => 
				l.Key.ToLower().Contains(term) || 
				l.Value.ToLower().Contains(term));
		}
		
		if (!string.IsNullOrWhiteSpace(language))
		{
			query = query.Where(l => l.Language == language);
		}
		
		return await query
			.OrderBy(l => l.Language)
			.ThenBy(l => l.Key)
			.Take(100) // Limit results for performance
			.ToListAsync(ct);
	}

	public async Task<IReadOnlyList<string>> GetSupportedLanguagesAsync(CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.view")) 
			throw new UnauthorizedAccessException("Missing permission: localization.view");
		
		return await _db.LocalizationLabels
			.AsNoTracking()
			.Select(l => l.Language)
			.Distinct()
			.OrderBy(l => l)
			.ToListAsync(ct);
	}

	public async Task<Dictionary<string, string>> GetTranslationsForLanguageAsync(string language, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.view")) 
			throw new UnauthorizedAccessException("Missing permission: localization.view");
		
		var translations = await _db.LocalizationLabels
			.AsNoTracking()
			.Where(l => l.Language == language)
			.ToListAsync(ct);
		
		return translations.ToDictionary(l => l.Key, l => l.Value);
	}

	public async Task<IReadOnlyList<LocalizationLabel>> BulkUpsertAsync(IEnumerable<LocalizationLabel> labels, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.upsert")) 
			throw new UnauthorizedAccessException("Missing permission: localization.upsert");
		
		var labelsList = labels.ToList();
		foreach (var label in labelsList)
		{
			if (label.Id == Guid.Empty)
				label.Id = Guid.NewGuid();
		}
		
		_db.LocalizationLabels.UpdateRange(labelsList);
		await _db.SaveChangesAsync(ct);
		return labelsList;
	}

	public async Task<bool> ImportFromJsonAsync(string language, Dictionary<string, string> translations, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.upsert")) 
			throw new UnauthorizedAccessException("Missing permission: localization.upsert");
		
		var labels = translations.Select(kvp => new LocalizationLabel
		{
			Id = Guid.NewGuid(),
			Key = kvp.Key,
			Language = language,
			Value = kvp.Value
		}).ToList();
		
		await BulkUpsertAsync(labels, ct);
		return true;
	}

	public async Task<Dictionary<string, Dictionary<string, string>>> ExportAllLanguagesAsync(CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.view")) 
			throw new UnauthorizedAccessException("Missing permission: localization.view");
		
		var allLabels = await _db.LocalizationLabels
			.AsNoTracking()
			.ToListAsync(ct);
		
		return allLabels
			.GroupBy(l => l.Language)
			.ToDictionary(
				g => g.Key,
				g => g.ToDictionary(l => l.Key, l => l.Value)
			);
	}

	public async Task<bool> ValidateTranslationsAsync(string language, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.view")) 
			throw new UnauthorizedAccessException("Missing permission: localization.view");
		
		var translations = await _db.LocalizationLabels
			.AsNoTracking()
			.Where(l => l.Language == language)
			.ToListAsync(ct);
		
		// Basic validation: check for empty values and invalid keys
		return translations.All(t => 
			!string.IsNullOrWhiteSpace(t.Value) && 
			!string.IsNullOrWhiteSpace(t.Key) &&
			Regex.IsMatch(t.Key, @"^[a-zA-Z0-9._-]+$")); // Valid key format
	}

	public async Task<IReadOnlyList<string>> GetMissingTranslationsAsync(string language, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.view")) 
			throw new UnauthorizedAccessException("Missing permission: localization.view");
		
		// Get all unique keys
		var allKeys = await _db.LocalizationLabels
			.AsNoTracking()
			.Select(l => l.Key)
			.Distinct()
			.ToListAsync(ct);
		
		// Get keys for the specified language
		var languageKeys = await _db.LocalizationLabels
			.AsNoTracking()
			.Where(l => l.Language == language)
			.Select(l => l.Key)
			.ToListAsync(ct);
		
		// Return missing keys
		return allKeys.Except(languageKeys).ToList();
	}
}


