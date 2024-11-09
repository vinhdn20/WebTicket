using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repositories.Migrations
{
    /// <inheritdoc />
    public partial class Add_ForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AGCustomerId",
                table: "ThongTinVes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "CardId",
                table: "ThongTinVes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "ThongTinVes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_ThongTinVes_AGCustomerId",
                table: "ThongTinVes",
                column: "AGCustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_ThongTinVes_CardId",
                table: "ThongTinVes",
                column: "CardId");

            migrationBuilder.CreateIndex(
                name: "IX_ThongTinVes_CustomerId",
                table: "ThongTinVes",
                column: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_ThongTinVes_AgCustomers_AGCustomerId",
                table: "ThongTinVes",
                column: "AGCustomerId",
                principalTable: "AgCustomers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ThongTinVes_Cards_CardId",
                table: "ThongTinVes",
                column: "CardId",
                principalTable: "Cards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ThongTinVes_Customers_CustomerId",
                table: "ThongTinVes",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ThongTinVes_AgCustomers_AGCustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropForeignKey(
                name: "FK_ThongTinVes_Cards_CardId",
                table: "ThongTinVes");

            migrationBuilder.DropForeignKey(
                name: "FK_ThongTinVes_Customers_CustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropIndex(
                name: "IX_ThongTinVes_AGCustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropIndex(
                name: "IX_ThongTinVes_CardId",
                table: "ThongTinVes");

            migrationBuilder.DropIndex(
                name: "IX_ThongTinVes_CustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "AGCustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "CardId",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "ThongTinVes");
        }
    }
}
