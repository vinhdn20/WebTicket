using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repositories.Migrations
{
    /// <inheritdoc />
    public partial class Add_VeDetail_V3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VeDetails_Customers_CustomerId",
                table: "VeDetails");

            migrationBuilder.DropIndex(
                name: "IX_VeDetails_CustomerId",
                table: "VeDetails");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "VeDetails");

            migrationBuilder.AddColumn<string>(
                name: "TenKhachHang",
                table: "VeDetails",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TenKhachHang",
                table: "VeDetails");

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "VeDetails",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_VeDetails_CustomerId",
                table: "VeDetails",
                column: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_VeDetails_Customers_CustomerId",
                table: "VeDetails",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
