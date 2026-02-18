using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Users.Commands.UpdateOnlineStatus;

public sealed class UpdateOnlineStatusCommandHandler : IRequestHandler<UpdateOnlineStatusCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeService _dateTimeService;

    public UpdateOnlineStatusCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IDateTimeService dateTimeService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _dateTimeService = dateTimeService;
    }

    public async Task<Result> Handle(UpdateOnlineStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(_currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return Result.Failure("User not found.");
        }

        user.SetOnlineStatus(request.IsOnline, _dateTimeService.UtcNow);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
