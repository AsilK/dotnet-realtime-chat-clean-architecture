using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Queries.GetRoomMembers;

public sealed record GetRoomMembersQuery(Guid RoomId) : IRequest<Result<IReadOnlyCollection<ChatRoomMemberDto>>>;
