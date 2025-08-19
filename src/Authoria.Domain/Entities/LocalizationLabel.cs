using System.ComponentModel.DataAnnotations;

namespace Authoria.Domain.Entities;

public class LocalizationLabel
{
	public Guid Id { get; set; }
	
	[Required]
	[StringLength(200)]
	public string Key { get; set; } = string.Empty;
	
	[Required]
	[StringLength(10)]
	public string Language { get; set; } = string.Empty; // e.g., en, ar, fr, es
	
	[Required]
	[StringLength(1000)]
	public string Value { get; set; } = string.Empty;
	
	public Guid? TenantId { get; set; } // optional tenant-specific overrides
	
	// Audit fields
	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	public DateTime? UpdatedAt { get; set; }
	public string? CreatedBy { get; set; }
	public string? UpdatedBy { get; set; }
}




