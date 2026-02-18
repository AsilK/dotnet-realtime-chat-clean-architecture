using AutoMapper;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Commands.CreateRoom;

public sealed class CreateRoomCommandHandler : IRequestHandler<CreateRoomCommand, Result<ChatRoomDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public CreateRoomCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<Result<ChatRoomDto>> Handle(CreateRoomCommand request, CancellationToken cancellationToken)
    {
        var room = ChatRoom.Create(request.Name, request.RoomType, _currentUser.UserId, request.Description);

        if (request.MemberIds is not null)
        {
            foreach (var memberId in request.MemberIds.Where(id => id != _currentUser.UserId).Distinct())
            {
                room.AddMember(memberId);
            }
        }

        await _unitOfWork.ChatRooms.AddAsync(room, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(_mapper.Map<ChatRoomDto>(room));
    }
}
