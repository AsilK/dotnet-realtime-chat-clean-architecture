using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Messages.Commands.MarkMessageAsRead;

public sealed class MarkMessageAsReadCommandHandler : IRequestHandler<MarkMessageAsReadCommand, Result<Guid>>
{
    private readonly ICacheService _cacheService;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public MarkMessageAsReadCommandHandler(ICacheService cacheService, ICurrentUserService currentUser, IUnitOfWork unitOfWork)
    {
        _cacheService = cacheService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Guid>> Handle(MarkMessageAsReadCommand request, CancellationToken cancellationToken)
    {
        var roomId = request.RoomId;
        if (!roomId.HasValue)
        {
            var message = await _unitOfWork.Messages.GetByIdAsync(request.MessageId, cancellationToken);
            if (message is null)
            {
                return Result.Failure<Guid>("Message not found.");
            }

            roomId = message.ChatRoomId;
        }

        var key = $"room:{roomId.Value}:last-read:{_currentUser.UserId}";
        await _cacheService.SetAsync(key, request.MessageId.ToString(), TimeSpan.FromDays(7), cancellationToken);

        return Result.Success(roomId.Value);
    }
}
