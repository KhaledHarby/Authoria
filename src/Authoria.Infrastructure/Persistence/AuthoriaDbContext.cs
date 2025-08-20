using Authoria.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Authoria.Infrastructure.Persistence;

public class AuthoriaDbContext : DbContext
{
	public AuthoriaDbContext(DbContextOptions<AuthoriaDbContext> options) : base(options) { }

	public DbSet<User> Users => Set<User>();
	public DbSet<Role> Roles => Set<Role>();
	public DbSet<Permission> Permissions => Set<Permission>();
	public DbSet<UserRole> UserRoles => Set<UserRole>();
	public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
	public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
	public DbSet<Tenant> Tenants => Set<Tenant>();
	public DbSet<UserTenant> UserTenants => Set<UserTenant>();
	public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
	public DbSet<LocalizationLabel> LocalizationLabels => Set<LocalizationLabel>();
	public DbSet<WebhookSubscription> WebhookSubscriptions => Set<WebhookSubscription>();
	public DbSet<WebhookDelivery> WebhookDeliveries => Set<WebhookDelivery>();
	public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
	public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		modelBuilder.Entity<User>(b =>
		{
			b.HasIndex(x => x.Email).IsUnique();
			b.Property(x => x.Email).HasMaxLength(256).IsRequired();
			b.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
		});

		modelBuilder.Entity<Role>(b =>
		{
			b.Property(x => x.Name).HasMaxLength(128).IsRequired();
			b.HasIndex(x => x.Name).IsUnique();
			b.HasOne(x => x.ParentRole).WithMany().HasForeignKey(x => x.ParentRoleId);
		});

		modelBuilder.Entity<Permission>(b =>
		{
			b.Property(x => x.Name).HasMaxLength(256).IsRequired();
			b.HasIndex(x => x.Name).IsUnique();
		});

		modelBuilder.Entity<UserRole>(b =>
		{
			b.HasKey(x => new { x.UserId, x.RoleId });
			b.HasOne(x => x.User).WithMany(x => x.UserRoles).HasForeignKey(x => x.UserId);
			b.HasOne(x => x.Role).WithMany(x => x.UserRoles).HasForeignKey(x => x.RoleId);
		});

		modelBuilder.Entity<RolePermission>(b =>
		{
			b.HasKey(x => new { x.RoleId, x.PermissionId });
			b.HasOne(x => x.Role).WithMany(x => x.RolePermissions).HasForeignKey(x => x.RoleId);
			b.HasOne(x => x.Permission).WithMany(x => x.RolePermissions).HasForeignKey(x => x.PermissionId);
		});

		modelBuilder.Entity<UserPermission>(b =>
		{
			b.HasKey(x => new { x.UserId, x.PermissionId });
			b.HasOne(x => x.User).WithMany(x => x.UserPermissions).HasForeignKey(x => x.UserId);
			b.HasOne(x => x.Permission).WithMany(x => x.UserPermissions).HasForeignKey(x => x.PermissionId);
			b.HasOne(x => x.GrantedByUser).WithMany().HasForeignKey(x => x.GrantedByUserId);
			b.Property(x => x.Notes).HasMaxLength(500);
		});

		modelBuilder.Entity<Tenant>(b =>
		{
			b.Property(x => x.Name).HasMaxLength(200).IsRequired();
			b.HasIndex(x => x.Domain).IsUnique(false);
		});

		modelBuilder.Entity<UserTenant>(b =>
		{
			b.HasKey(x => new { x.UserId, x.TenantId });
			b.HasOne(x => x.User).WithMany(x => x.UserTenants).HasForeignKey(x => x.UserId);
			b.HasOne(x => x.Tenant).WithMany(x => x.UserTenants).HasForeignKey(x => x.TenantId);
		});

		modelBuilder.Entity<LocalizationLabel>(b =>
		{
			b.HasIndex(x => new { x.Key, x.Language, x.TenantId }).IsUnique();
			b.Property(x => x.Key).HasMaxLength(256).IsRequired();
			b.Property(x => x.Language).HasMaxLength(10).IsRequired();
		});

		modelBuilder.Entity<WebhookSubscription>(b =>
		{
			b.HasIndex(x => new { x.TenantId, x.IsActive });
			b.Property(x => x.TargetUrlEncrypted).HasMaxLength(1024).IsRequired();
			b.Property(x => x.SecretHash).HasMaxLength(512).IsRequired();
		});

		modelBuilder.Entity<WebhookDelivery>(b =>
		{
			b.HasIndex(x => new { x.SubscriptionId, x.EventId });
		});

		modelBuilder.Entity<RefreshToken>(b =>
		{
			b.HasIndex(x => new { x.UserId, x.Token }).IsUnique();
			b.Property(x => x.Token).HasMaxLength(512).IsRequired();
		});

		modelBuilder.Entity<PasswordResetToken>(b =>
		{
			b.HasIndex(x => x.Token).IsUnique();
			b.Property(x => x.Token).HasMaxLength(512).IsRequired();
		});

		modelBuilder.Entity<AuditLog>(b =>
		{
			b.HasIndex(x => new { x.TenantId, x.OccurredAtUtc });
			b.HasIndex(x => new { x.ActorUserId, x.OccurredAtUtc });
			b.Property(x => x.Action).HasMaxLength(100).IsRequired();
			b.Property(x => x.ResourceType).HasMaxLength(100).IsRequired();
			b.Property(x => x.ResourceId).HasMaxLength(100);
			b.Property(x => x.DetailsJson).HasMaxLength(4000);
		});
	}
}




