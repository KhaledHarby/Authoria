using Authoria.Application.Localization;
using Authoria.Application.Common;
using Authoria.Domain.Entities;
using Authoria.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LocalizationController : ControllerBase
{
	private readonly ILocalizationService _loc;
	private readonly ICurrentUserContext _currentUser;
	
	public LocalizationController(ILocalizationService loc, ICurrentUserContext currentUser) 
	{ 
		_loc = loc; 
		_currentUser = currentUser;
	}

	[HttpGet]
	public async Task<IActionResult> List() => Ok(await _loc.ListAsync());

	[HttpGet("paginated")]
	public async Task<IActionResult> GetPaginated([FromQuery] PaginationRequest request) 
		=> Ok(await _loc.GetPaginatedAsync(request));

	[HttpGet("{id:guid}")]
	public async Task<IActionResult> GetById(Guid id)
	{
		var label = await _loc.GetByIdAsync(id);
		if (label == null) return NotFound();
		return Ok(label);
	}

	[HttpPost]
	public async Task<IActionResult> Create([FromBody] CreateLocalizationLabelRequest request)
	{
		var label = new LocalizationLabel
		{
			Key = request.Key,
			Language = request.Language,
			Value = request.Value,
			TenantId = request.TenantId ?? _currentUser.TenantId
		};
		
		var result = await _loc.UpsertAsync(label);
		return Ok(result);
	}

	[HttpPut("{id:guid}")]
	public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLocalizationLabelRequest request)
	{
		if (id != request.Id) return BadRequest("ID mismatch");
		
		var label = new LocalizationLabel
		{
			Id = request.Id,
			Key = request.Key,
			Language = request.Language,
			Value = request.Value,
			TenantId = request.TenantId ?? _currentUser.TenantId
		};
		
		var result = await _loc.UpsertAsync(label);
		return Ok(result);
	}

	[HttpDelete("{id:guid}")]
	public async Task<IActionResult> Delete(Guid id)
	{
		var success = await _loc.DeleteAsync(id);
		if (!success) return NotFound();
		return NoContent();
	}

	[HttpGet("search")]
	public async Task<IActionResult> Search([FromQuery] string searchTerm, [FromQuery] string? language)
		=> Ok(await _loc.SearchAsync(searchTerm, language));

	[HttpGet("languages")]
	public async Task<IActionResult> GetSupportedLanguages()
		=> Ok(await _loc.GetSupportedLanguagesAsync());

	[HttpGet("languages/{language}/translations")]
	[AllowAnonymous]
	public async Task<IActionResult> GetTranslationsForLanguage(string language)
		=> Ok(await _loc.GetTranslationsForLanguageAsync(language));

	[HttpPost("bulk")]
	public async Task<IActionResult> BulkUpsert([FromBody] List<LocalizationLabel> labels)
	{
		// Set tenant ID for all labels if not provided
		foreach (var label in labels)
		{
			if (label.TenantId == null)
			{
				label.TenantId = _currentUser.TenantId;
			}
		}
		
		return Ok(await _loc.BulkUpsertAsync(labels));
	}

	[HttpPost("import")]
	public async Task<IActionResult> Import([FromBody] ImportTranslationsRequest request)
	{
		var success = await _loc.ImportFromJsonAsync(request.Language, request.Translations, _currentUser.TenantId);
		return Ok(new { success });
	}

	[HttpGet("export")]
	public async Task<IActionResult> Export()
	{
		var translations = await _loc.ExportAllLanguagesAsync();
		var response = new ExportTranslationsResponse
		{
			Translations = translations,
			ExportedAt = DateTime.UtcNow,
			TotalLanguages = translations.Count,
			TotalKeys = translations.Values.Sum(lang => lang.Count)
		};
		return Ok(response);
	}

	[HttpGet("validate/{language}")]
	public async Task<IActionResult> ValidateLanguage(string language)
	{
		var isValid = await _loc.ValidateTranslationsAsync(language);
		return Ok(new { language, isValid });
	}

	[HttpGet("missing/{language}")]
	public async Task<IActionResult> GetMissingTranslations(string language)
		=> Ok(await _loc.GetMissingTranslationsAsync(language));

	[HttpGet("analytics")]
	public async Task<IActionResult> GetAnalytics()
	{
		var languages = await _loc.GetSupportedLanguagesAsync();
		var allLabels = await _loc.ListAsync();
		
		var analytics = languages.Select(lang =>
		{
			var langLabels = allLabels.Where(l => l.Language == lang).ToList();
			var totalKeys = allLabels.Select(l => l.Key).Distinct().Count();
			var langKeys = langLabels.Count;
			var completionPercentage = totalKeys > 0 ? (double)langKeys / totalKeys * 100 : 0;
			
			return new
			{
				Language = lang,
				TranslationCount = langKeys,
				TotalKeys = totalKeys,
				CompletionPercentage = Math.Round(completionPercentage, 2),
				IsComplete = langKeys == totalKeys
			};
		}).ToList();
		
		return Ok(new
		{
			TotalLanguages = languages.Count,
			TotalKeys = allLabels.Select(l => l.Key).Distinct().Count(),
			TotalTranslations = allLabels.Count,
			Languages = analytics
		});
	}
}


