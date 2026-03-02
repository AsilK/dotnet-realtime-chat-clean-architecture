using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;

namespace ChatApp.Application.Common.Interfaces;

public interface IUserRepository : IBaseRepository<User>
{
    Task<User?> GetByIdReadOnlyAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ExistsByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<PaginatedList<User>> SearchAsync(string? term, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<bool> IsBlockedAsync(Guid blockerUserId, Guid blockedUserId, CancellationToken cancellationToken = default);
    Task AddBlockAsync(UserBlock block, CancellationToken cancellationToken = default);
    Task RemoveBlockAsync(Guid blockerUserId, Guid blockedUserId, CancellationToken cancellationToken = default);
}
