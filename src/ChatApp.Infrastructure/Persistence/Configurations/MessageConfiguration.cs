using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChatApp.Infrastructure.Persistence.Configurations;

public sealed class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("Messages");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Content).HasMaxLength(4000).IsRequired();
        builder.Property(x => x.Type).HasConversion<int>().HasDefaultValue(MessageType.Text);

        builder.HasIndex(x => new { x.ChatRoomId, x.CreatedAtUtc });
        builder.HasIndex(x => x.ReplyToMessageId);
    }
}
