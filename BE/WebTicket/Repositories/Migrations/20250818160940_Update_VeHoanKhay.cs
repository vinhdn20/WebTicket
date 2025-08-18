using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repositories.Migrations
{
    /// <inheritdoc />
    public partial class Update_VeHoanKhay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""ThongTinVes""
                ALTER COLUMN ""VeHoanKhay"" DROP DEFAULT;
            ");

            //migrationBuilder.AlterColumn<bool>(
            //    name: "VeHoanKhay",
            //    table: "ThongTinVes",
            //    type: "boolean",
            //    nullable: false,
            //    oldClrType: typeof(string),
            //    oldType: "text");

            migrationBuilder.Sql(@"
                ALTER TABLE ""ThongTinVes""
                ALTER COLUMN ""VeHoanKhay"" TYPE boolean
                USING (""VeHoanKhay""::boolean);
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""ThongTinVes""
                ALTER COLUMN ""VeHoanKhay"" SET DEFAULT false;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""ThongTinVes""
                ALTER COLUMN ""VeHoanKhay"" DROP DEFAULT;
            ");
            //migrationBuilder.AlterColumn<string>(
            //    name: "VeHoanKhay",
            //    table: "ThongTinVes",
            //    type: "text",
            //    nullable: false,
            //    oldClrType: typeof(bool),
            //    oldType: "boolean");
            migrationBuilder.Sql(@"
                ALTER TABLE ""ThongTinVes""
                ALTER COLUMN ""VeHoanKhay"" TYPE text
                USING (""VeHoanKhay""::text);
            ");
        }
    }
}
