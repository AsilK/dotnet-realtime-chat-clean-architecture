using ChatApp.Application.Common.Interfaces;
using ChatApp.Infrastructure.Persistence.Repositories;

namespace ChatApp.Infrastructure.Persistence;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Users = new UserRepository(_context);
        ChatRooms = new ChatRoomRepository(_context);
        Messages = new MessageRepository(_context);
        RefreshTokens = new RefreshTokenRepository(_context);
    }

    public IUserRepository Users { get; }
    public IChatRoomRepository ChatRooms { get; }
    public IMessageRepository Messages { get; }
    public IRefreshTokenRepository RefreshTokens { get; }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
