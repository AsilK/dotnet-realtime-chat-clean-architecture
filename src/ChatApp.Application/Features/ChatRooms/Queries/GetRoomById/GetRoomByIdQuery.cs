using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Queries.GetRoomById;

public sealed record GetRoomByIdQuery(Guid RoomId) : IRequest<Result<ChatRoomDto>>;
