using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Commands.LeaveRoom;

public sealed record LeaveRoomCommand(Guid RoomId) : IRequest<Result>;
