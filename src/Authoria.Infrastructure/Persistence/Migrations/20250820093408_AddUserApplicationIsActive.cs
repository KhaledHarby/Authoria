using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Authoria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserApplicationIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserPermissions_Applications_ApplicationId",
                table: "UserPermissions");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "UserApplications",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_UserPermissions_Applications_ApplicationId",
                table: "UserPermissions",
                column: "ApplicationId",
                principalTable: "Applications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserPermissions_Applications_ApplicationId",
                table: "UserPermissions");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "UserApplications");

            migrationBuilder.AddForeignKey(
                name: "FK_UserPermissions_Applications_ApplicationId",
                table: "UserPermissions",
                column: "ApplicationId",
                principalTable: "Applications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
