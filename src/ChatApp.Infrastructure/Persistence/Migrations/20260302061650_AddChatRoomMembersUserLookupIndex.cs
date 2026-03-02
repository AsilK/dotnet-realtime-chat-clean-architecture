using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddChatRoomMembersUserLookupIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomMembers_UserId_IsBanned_ChatRoomId",
                table: "ChatRoomMembers",
                columns: new[] { "UserId", "IsBanned", "ChatRoomId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatRoomMembers_UserId_IsBanned_ChatRoomId",
                table: "ChatRoomMembers");
        }
    }
}
