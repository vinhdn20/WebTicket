using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repositories.Migrations
{
    /// <inheritdoc />
    public partial class Add_VeDetail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ThongTinVes_AgCustomers_AGCustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropForeignKey(
                name: "FK_ThongTinVes_Customers_CustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropIndex(
                name: "IX_ThongTinVes_AGCustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropIndex(
                name: "IX_ThongTinVes_CustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "AGCustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "ChangDi",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "ChangVe",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "MaDatChoHang",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "MaDatChoTrip",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "NgayGioBayDen",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "NgayGioBayDi",
                table: "ThongTinVes");

            migrationBuilder.DropColumn(
                name: "TaiKhoan",
                table: "ThongTinVes");

            migrationBuilder.CreateTable(
                name: "VeDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AGCustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChangBay = table.Column<string>(type: "text", nullable: false),
                    NgayGioBay = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HangBay = table.Column<string>(type: "text", nullable: false),
                    SoHieuChuyenBay = table.Column<string>(type: "text", nullable: false),
                    ThamChieuHang = table.Column<string>(type: "text", nullable: false),
                    MaDatCho = table.Column<string>(type: "text", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ThongTinVeId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    ModifiedById = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VeDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VeDetails_AgCustomers_AGCustomerId",
                        column: x => x.AGCustomerId,
                        principalTable: "AgCustomers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VeDetails_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VeDetails_ThongTinVes_ThongTinVeId",
                        column: x => x.ThongTinVeId,
                        principalTable: "ThongTinVes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VeDetails_AGCustomerId",
                table: "VeDetails",
                column: "AGCustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_VeDetails_CustomerId",
                table: "VeDetails",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_VeDetails_ThongTinVeId",
                table: "VeDetails",
                column: "ThongTinVeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VeDetails");

            migrationBuilder.AddColumn<Guid>(
                name: "AGCustomerId",
                table: "ThongTinVes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "ChangDi",
                table: "ThongTinVes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ChangVe",
                table: "ThongTinVes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "ThongTinVes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "MaDatChoHang",
                table: "ThongTinVes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MaDatChoTrip",
                table: "ThongTinVes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayGioBayDen",
                table: "ThongTinVes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayGioBayDi",
                table: "ThongTinVes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "TaiKhoan",
                table: "ThongTinVes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ThongTinVes_AGCustomerId",
                table: "ThongTinVes",
                column: "AGCustomerId");

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
                name: "FK_ThongTinVes_Customers_CustomerId",
                table: "ThongTinVes",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
