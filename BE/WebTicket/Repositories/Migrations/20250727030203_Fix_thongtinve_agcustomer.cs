using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repositories.Migrations
{
    /// <inheritdoc />
    public partial class Fix_thongtinve_agcustomer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VeDetails_AgCustomers_AGCustomerId",
                table: "VeDetails");

            migrationBuilder.DropIndex(
                name: "IX_VeDetails_AGCustomerId",
                table: "VeDetails");

            migrationBuilder.DropColumn(
                name: "AGCustomerId",
                table: "VeDetails");

            migrationBuilder.AddColumn<Guid>(
                name: "AGCustomerId",
                table: "ThongTinVes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_ThongTinVes_AGCustomerId",
                table: "ThongTinVes",
                column: "AGCustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_ThongTinVes_AgCustomers_AGCustomerId",
                table: "ThongTinVes",
                column: "AGCustomerId",
                principalTable: "AgCustomers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ThongTinVes_AgCustomers_AGCustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropIndex(
                name: "IX_ThongTinVes_AGCustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "AGCustomerId",
                table: "ThongTinVes");

            migrationBuilder.AddColumn<Guid>(
                name: "AGCustomerId",
                table: "VeDetails",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_VeDetails_AGCustomerId",
                table: "VeDetails",
                column: "AGCustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_VeDetails_AgCustomers_AGCustomerId",
                table: "VeDetails",
                column: "AGCustomerId",
                principalTable: "AgCustomers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
