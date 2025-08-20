using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Authoria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ScopeUserPermissionsByTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserPermissions",
                table: "UserPermissions");

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "UserPermissions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserPermissions",
                table: "UserPermissions",
                columns: new[] { "UserId", "PermissionId", "TenantId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_TenantId",
                table: "UserPermissions",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserPermissions_Tenants_TenantId",
                table: "UserPermissions",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserPermissions_Tenants_TenantId",
                table: "UserPermissions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserPermissions",
                table: "UserPermissions");

            migrationBuilder.DropIndex(
                name: "IX_UserPermissions_TenantId",
                table: "UserPermissions");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "UserPermissions");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserPermissions",
                table: "UserPermissions",
                columns: new[] { "UserId", "PermissionId" });
        }
    }
}
