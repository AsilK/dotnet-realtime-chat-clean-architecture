using ChatApp.Application.Common.Interfaces;
using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> UsersSet => Set<User>();
    public DbSet<ChatRoom> ChatRoomsSet => Set<ChatRoom>();
    public DbSet<ChatRoomMember> ChatRoomMembersSet => Set<ChatRoomMember>();
    public DbSet<Message> MessagesSet => Set<Message>();
    public DbSet<MessageReaction> MessageReactionsSet => Set<MessageReaction>();
    public DbSet<RefreshToken> RefreshTokensSet => Set<RefreshToken>();
    public DbSet<UserBlock> UserBlocksSet => Set<UserBlock>();

    IQueryable<User> IApplicationDbContext.Users => UsersSet;
    IQueryable<ChatRoom> IApplicationDbContext.ChatRooms => ChatRoomsSet;
    IQueryable<ChatRoomMember> IApplicationDbContext.ChatRoomMembers => ChatRoomMembersSet;
    IQueryable<Message> IApplicationDbContext.Messages => MessagesSet;
    IQueryable<RefreshToken> IApplicationDbContext.RefreshTokens => RefreshTokensSet;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
