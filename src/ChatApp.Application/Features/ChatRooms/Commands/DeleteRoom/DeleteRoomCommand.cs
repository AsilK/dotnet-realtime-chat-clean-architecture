using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Commands.DeleteRoom;

public sealed record DeleteRoomCommand(Guid RoomId) : IRequest<Result>;
