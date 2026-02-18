using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.Logout;

public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeService _dateTimeService;
    private readonly ICurrentUserService _currentUserService;

    public LogoutCommandHandler(IUnitOfWork unitOfWork, IDateTimeService dateTimeService, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _dateTimeService = dateTimeService;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = Features.Auth.TokenHashing.Sha256(request.RefreshToken);
        var existing = await _unitOfWork.RefreshTokens.GetByTokenHashAsync(tokenHash, cancellationToken);

        if (existing is null)
        {
            return Result.Success();
        }

        existing.Revoke(_dateTimeService.UtcNow, _currentUserService.IpAddress, "User logout");
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
