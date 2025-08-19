using System.ComponentModel.DataAnnotations;

namespace Authoria.Application.Localization;

public class CreateLocalizationLabelRequest
{
	[Required]
	[StringLength(200)]
	public string Key { get; set; } = string.Empty;

	[Required]
	[StringLength(10)]
	public string Language { get; set; } = string.Empty;

	[Required]
	[StringLength(1000)]
	public string Value { get; set; } = string.Empty;

	public Guid? TenantId { get; set; }
}

public class UpdateLocalizationLabelRequest
{
	[Required]
	public Guid Id { get; set; }

	[Required]
	[StringLength(200)]
	public string Key { get; set; } = string.Empty;

	[Required]
	[StringLength(10)]
	public string Language { get; set; } = string.Empty;

	[Required]
	[StringLength(1000)]
	public string Value { get; set; } = string.Empty;

	public Guid? TenantId { get; set; }
}

public class LocalizationLabelDto
{
	public Guid Id { get; set; }
	public string Key { get; set; } = string.Empty;
	public string Language { get; set; } = string.Empty;
	public string Value { get; set; } = string.Empty;
	public Guid? TenantId { get; set; }
	public DateTime CreatedAt { get; set; }
	public DateTime? UpdatedAt { get; set; }
}

public class LocalizationSearchRequest
{
	public string SearchTerm { get; set; } = string.Empty;
	public string? Language { get; set; }
	public string? Key { get; set; }
	public Guid? TenantId { get; set; }
}

public class ImportTranslationsRequest
{
	[Required]
	[StringLength(10)]
	public string Language { get; set; } = string.Empty;

	[Required]
	public Dictionary<string, string> Translations { get; set; } = new();

	public bool OverwriteExisting { get; set; } = false;
}

public class ExportTranslationsResponse
{
	public Dictionary<string, Dictionary<string, string>> Translations { get; set; } = new();
	public DateTime ExportedAt { get; set; }
	public int TotalLanguages { get; set; }
	public int TotalKeys { get; set; }
}

public class LanguageInfo
{
	public string Code { get; set; } = string.Empty;
	public string Name { get; set; } = string.Empty;
	public string NativeName { get; set; } = string.Empty;
	public int TranslationCount { get; set; }
	public bool IsComplete { get; set; }
	public double CompletionPercentage { get; set; }
}

public class TranslationValidationResult
{
	public string Language { get; set; } = string.Empty;
	public bool IsValid { get; set; }
	public List<string> Errors { get; set; } = new();
	public List<string> Warnings { get; set; } = new();
	public int TotalKeys { get; set; }
	public int ValidKeys { get; set; }
	public int InvalidKeys { get; set; }
}
