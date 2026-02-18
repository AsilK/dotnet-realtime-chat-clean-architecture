using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Commands.JoinRoom;

public sealed record JoinRoomCommand(Guid RoomId) : IRequest<Result>;
