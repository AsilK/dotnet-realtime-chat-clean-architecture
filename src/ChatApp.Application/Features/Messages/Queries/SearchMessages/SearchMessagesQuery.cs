using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Messages.Queries.SearchMessages;

public sealed record SearchMessagesQuery(Guid RoomId, string Term, int PageNumber = 1, int PageSize = 50) : IRequest<Result<PaginatedList<MessageDto>>>;
