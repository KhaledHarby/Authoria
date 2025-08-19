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
		
		var query = _db.LocalizationLabels.AsNoTracking();
		
		// Filter by tenant ID if available
		if (_current.TenantId.HasValue)
		{
			query = query.Where(l => l.TenantId == _current.TenantId || l.TenantId == null);
		}
		
		return await query
			.OrderBy(l => l.Language)
			.ThenBy(l => l.Key)
			.ToListAsync(ct);
	}

	public async Task<LocalizationLabel> UpsertAsync(LocalizationLabel label, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.upsert")) 
			throw new UnauthorizedAccessException("Missing permission: localization.upsert");
		
		// Set tenant ID if not provided
		if (label.TenantId == null)
		{
			label.TenantId = _current.TenantId;
		}
		
		// Check if a label with the same key, language, and tenant already exists
		var existingLabel = await _db.LocalizationLabels
			.FirstOrDefaultAsync(l => 
				l.Key == label.Key && 
				l.Language == label.Language && 
				l.TenantId == label.TenantId, ct);
		
		if (existingLabel != null)
		{
			// Update existing label
			existingLabel.Value = label.Value;
			existingLabel.UpdatedAt = DateTime.UtcNow;
			existingLabel.UpdatedBy = _current.UserId?.ToString();
			
			_db.LocalizationLabels.Update(existingLabel);
			await _db.SaveChangesAsync(ct);
			return existingLabel;
		}
		else
		{
			// Create new label
			if (label.Id == Guid.Empty) 
				label.Id = Guid.NewGuid();
			
			label.CreatedAt = DateTime.UtcNow;
			label.CreatedBy = _current.UserId?.ToString();
			
			_db.LocalizationLabels.Add(label);
			await _db.SaveChangesAsync(ct);
			return label;
		}
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
		
		// Filter by tenant ID if available
		if (_current.TenantId.HasValue)
		{
			query = query.Where(l => l.TenantId == _current.TenantId || l.TenantId == null);
		}
		
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
		
		// Filter by tenant ID if available
		if (_current.TenantId.HasValue)
		{
			query = query.Where(l => l.TenantId == _current.TenantId || l.TenantId == null);
		}
		
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
		
		var query = _db.LocalizationLabels.AsNoTracking();
		
		// Filter by tenant ID if available
		if (_current.TenantId.HasValue)
		{
			query = query.Where(l => l.TenantId == _current.TenantId || l.TenantId == null);
		}
		
		return await query
			.Select(l => l.Language)
			.Distinct()
			.OrderBy(l => l)
			.ToListAsync(ct);
	}

	public async Task<Dictionary<string, string>> GetTranslationsForLanguageAsync(string language, CancellationToken ct = default)
	{
		// Skip permission check for this method as it's used by the i18n system
		// and needs to be accessible without authentication
		
		var query = _db.LocalizationLabels.AsNoTracking().Where(l => l.Language == language);
		
		// For anonymous access, only return global labels (null tenant ID)
		// For authenticated users, filter by tenant ID if available
		if (_current.UserId.HasValue && _current.TenantId.HasValue)
		{
			query = query.Where(l => l.TenantId == _current.TenantId || l.TenantId == null);
		}
		else
		{
			// Anonymous access - only global labels
			query = query.Where(l => l.TenantId == null);
		}
		
		var translations = await query.ToListAsync(ct);
		
		return translations.ToDictionary(l => l.Key, l => l.Value);
	}

	public async Task<IReadOnlyList<LocalizationLabel>> BulkUpsertAsync(IEnumerable<LocalizationLabel> labels, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.upsert")) 
			throw new UnauthorizedAccessException("Missing permission: localization.upsert");
		
		var labelsList = labels.ToList();
		var result = new List<LocalizationLabel>();
		
		foreach (var label in labelsList)
		{
			// Set tenant ID if not provided
			if (label.TenantId == null)
			{
				label.TenantId = _current.TenantId;
			}
			
			// Use the single UpsertAsync method for each label to handle conflicts properly
			var upsertedLabel = await UpsertAsync(label, ct);
			result.Add(upsertedLabel);
		}
		
		return result;
	}

	public async Task<bool> ImportFromJsonAsync(string language, Dictionary<string, string> translations, Guid? tenantId = null, CancellationToken ct = default)
	{
		if (!_current.HasPermission("localization.upsert")) 
			throw new UnauthorizedAccessException("Missing permission: localization.upsert");
		
		var labels = translations.Select(kvp => new LocalizationLabel
		{
			Key = kvp.Key,
			Language = language,
			Value = kvp.Value,
			TenantId = tenantId ?? _current.TenantId
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


