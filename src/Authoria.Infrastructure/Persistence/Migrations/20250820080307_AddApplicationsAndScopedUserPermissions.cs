using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Authoria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationsAndScopedUserPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserPermissions",
                table: "UserPermissions");

            migrationBuilder.AddColumn<Guid>(
                name: "ApplicationId",
                table: "UserPermissions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserPermissions",
                table: "UserPermissions",
                columns: new[] { "UserId", "PermissionId", "TenantId", "ApplicationId" });

            migrationBuilder.CreateTable(
                name: "Applications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Applications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Applications_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserApplications",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserApplications", x => new { x.UserId, x.ApplicationId });
                    table.ForeignKey(
                        name: "FK_UserApplications_Applications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "Applications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserApplications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_ApplicationId",
                table: "UserPermissions",
                column: "ApplicationId");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_TenantId_Name",
                table: "Applications",
                columns: new[] { "TenantId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserApplications_ApplicationId",
                table: "UserApplications",
                column: "ApplicationId");

            // Seed a default application per tenant and backfill UserPermissions.ApplicationId
            migrationBuilder.Sql(@"
                IF OBJECT_ID('tempdb..#DefaultApps') IS NOT NULL DROP TABLE #DefaultApps;
                CREATE TABLE #DefaultApps (TenantId UNIQUEIDENTIFIER NOT NULL, AppId UNIQUEIDENTIFIER NOT NULL);

                INSERT INTO Applications (Id, TenantId, Name, Description, CreatedAtUtc)
                OUTPUT inserted.TenantId, inserted.Id INTO #DefaultApps(TenantId, AppId)
                SELECT NEWID(), t.Id, 'Default', 'Auto-created by migration', SYSUTCDATETIME()
                FROM Tenants t
                WHERE NOT EXISTS (
                    SELECT 1 FROM Applications a WHERE a.TenantId = t.Id AND a.Name = 'Default'
                );

                -- Ensure mapping for tenants that already had a 'Default' app
                INSERT INTO #DefaultApps (TenantId, AppId)
                SELECT a.TenantId, a.Id
                FROM Applications a
                WHERE a.Name = 'Default' AND NOT EXISTS (
                    SELECT 1 FROM #DefaultApps d WHERE d.TenantId = a.TenantId
                );

                -- Backfill UserPermissions.ApplicationId using default app per tenant
                UPDATE up
                SET up.ApplicationId = d.AppId
                FROM UserPermissions up
                INNER JOIN #DefaultApps d ON d.TenantId = up.TenantId
                WHERE up.ApplicationId = '00000000-0000-0000-0000-000000000000';

                DROP TABLE #DefaultApps;
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_UserPermissions_Applications_ApplicationId",
                table: "UserPermissions",
                column: "ApplicationId",
                principalTable: "Applications",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserPermissions_Applications_ApplicationId",
                table: "UserPermissions");

            migrationBuilder.DropTable(
                name: "UserApplications");

            migrationBuilder.DropTable(
                name: "Applications");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserPermissions",
                table: "UserPermissions");

            migrationBuilder.DropIndex(
                name: "IX_UserPermissions_ApplicationId",
                table: "UserPermissions");

            migrationBuilder.DropColumn(
                name: "ApplicationId",
                table: "UserPermissions");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserPermissions",
                table: "UserPermissions",
                columns: new[] { "UserId", "PermissionId", "TenantId" });
        }
    }
}
