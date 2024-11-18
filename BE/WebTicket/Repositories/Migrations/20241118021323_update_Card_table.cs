using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repositories.Migrations
{
    /// <inheritdoc />
    public partial class update_Card_table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TaiKhoan",
                table: "Cards");

            migrationBuilder.AddColumn<string>(
                name: "TaiKhoan",
                table: "ThongTinVes",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TaiKhoan",
                table: "ThongTinVes");

            migrationBuilder.AddColumn<string>(
                name: "TaiKhoan",
                table: "Cards",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
