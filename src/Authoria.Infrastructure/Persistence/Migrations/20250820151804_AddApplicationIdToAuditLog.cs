using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Authoria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationIdToAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ApplicationId",
                table: "AuditLogs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_ApplicationId_OccurredAtUtc",
                table: "AuditLogs",
                columns: new[] { "ApplicationId", "OccurredAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_ApplicationId_OccurredAtUtc",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "ApplicationId",
                table: "AuditLogs");
        }
    }
}
