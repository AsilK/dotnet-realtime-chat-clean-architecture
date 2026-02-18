namespace ChatApp.Application.Common.Interfaces;

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    IChatRoomRepository ChatRooms { get; }
    IMessageRepository Messages { get; }
    IRefreshTokenRepository RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
