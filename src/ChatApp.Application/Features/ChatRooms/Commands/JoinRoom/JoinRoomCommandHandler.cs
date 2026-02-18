using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Commands.JoinRoom;

public sealed class JoinRoomCommandHandler : IRequestHandler<JoinRoomCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public JoinRoomCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(JoinRoomCommand request, CancellationToken cancellationToken)
    {
        var room = await _unitOfWork.ChatRooms.GetByIdAsync(request.RoomId, cancellationToken);
        if (room is null)
        {
            return Result.Failure("Room not found.");
        }

        if (await _unitOfWork.ChatRooms.IsMemberAsync(request.RoomId, _currentUser.UserId, cancellationToken))
        {
            return Result.Success();
        }

        room.AddMember(_currentUser.UserId);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
