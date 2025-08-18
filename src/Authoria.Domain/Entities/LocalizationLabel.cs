namespace Authoria.Domain.Entities;

public class LocalizationLabel
{
	public Guid Id { get; set; }
	public string Key { get; set; } = string.Empty;
	public string Language { get; set; } = string.Empty; // e.g., en, ar
	public string Value { get; set; } = string.Empty;
	public Guid? TenantId { get; set; } // optional tenant-specific overrides
}




