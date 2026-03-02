using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChatApp.Infrastructure.Persistence.Configurations;

public sealed class ChatRoomMemberConfiguration : IEntityTypeConfiguration<ChatRoomMember>
{
    public void Configure(EntityTypeBuilder<ChatRoomMember> builder)
    {
        builder.ToTable("ChatRoomMembers");

        builder.HasKey(x => new { x.ChatRoomId, x.UserId });
        builder.Property(x => x.Role).HasConversion<int>().HasDefaultValue(MemberRole.Member);
        builder.HasIndex(x => new { x.UserId, x.IsBanned, x.ChatRoomId });
    }
}
