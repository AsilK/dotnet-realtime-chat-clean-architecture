using AutoMapper;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Queries.GetRoomMembers;

public sealed class GetRoomMembersQueryHandler : IRequestHandler<GetRoomMembersQuery, Result<IReadOnlyCollection<ChatRoomMemberDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetRoomMembersQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<Result<IReadOnlyCollection<ChatRoomMemberDto>>> Handle(GetRoomMembersQuery request, CancellationToken cancellationToken)
    {
        var room = await _unitOfWork.ChatRooms.GetByIdAsync(request.RoomId, cancellationToken);
        if (room is null)
        {
            return Result.Failure<IReadOnlyCollection<ChatRoomMemberDto>>("Room not found.");
        }

        var members = room.Members.Select(_mapper.Map<ChatRoomMemberDto>).ToArray();
        return Result.Success<IReadOnlyCollection<ChatRoomMemberDto>>(members);
    }
}
