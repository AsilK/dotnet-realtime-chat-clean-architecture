using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Messages.Queries.GetRoomMessages;

public sealed record GetRoomMessagesQuery(Guid RoomId, int PageNumber = 1, int PageSize = 50) : IRequest<Result<PaginatedList<MessageDto>>>;
