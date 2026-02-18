using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Commands.DeleteRoom;

public sealed class DeleteRoomCommandHandler : IRequestHandler<DeleteRoomCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteRoomCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(DeleteRoomCommand request, CancellationToken cancellationToken)
    {
        var room = await _unitOfWork.ChatRooms.GetByIdAsync(request.RoomId, cancellationToken);
        if (room is null)
        {
            return Result.Failure("Room not found.");
        }

        if (room.CreatedByUserId != _currentUser.UserId)
        {
            return Result.Failure("Only room owner can delete room.");
        }

        room.MarkDeleted();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
