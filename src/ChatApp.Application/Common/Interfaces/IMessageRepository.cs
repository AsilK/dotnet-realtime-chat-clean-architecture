using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;

namespace ChatApp.Application.Common.Interfaces;

public interface IMessageRepository : IBaseRepository<Message>
{
    Task<PaginatedList<Message>> GetRoomMessagesAsync(Guid roomId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<PaginatedList<Message>> SearchMessagesAsync(Guid roomId, string term, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
}
