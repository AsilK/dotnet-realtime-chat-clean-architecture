using ChatApp.Application.Common.Models;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Commands.CreateRoom;

public sealed record CreateRoomCommand(
    string Name,
    string? Description,
    RoomType RoomType,
    IReadOnlyCollection<Guid>? MemberIds = null) : IRequest<Result<ChatRoomDto>>;
