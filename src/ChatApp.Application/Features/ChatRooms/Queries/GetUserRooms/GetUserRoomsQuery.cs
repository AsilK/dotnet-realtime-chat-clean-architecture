using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Queries.GetUserRooms;

public sealed record GetUserRoomsQuery(int PageNumber = 1, int PageSize = 20) : IRequest<Result<PaginatedList<ChatRoomDto>>>;
