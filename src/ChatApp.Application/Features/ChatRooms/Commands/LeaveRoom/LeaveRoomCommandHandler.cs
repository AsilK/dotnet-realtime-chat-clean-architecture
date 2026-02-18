using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Commands.LeaveRoom;

public sealed class LeaveRoomCommandHandler : IRequestHandler<LeaveRoomCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public LeaveRoomCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(LeaveRoomCommand request, CancellationToken cancellationToken)
    {
        var room = await _unitOfWork.ChatRooms.GetByIdAsync(request.RoomId, cancellationToken);
        if (room is null)
        {
            return Result.Failure("Room not found.");
        }

        room.RemoveMember(_currentUser.UserId);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
