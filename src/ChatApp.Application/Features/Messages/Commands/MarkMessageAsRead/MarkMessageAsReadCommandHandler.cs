using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Messages.Commands.MarkMessageAsRead;

public sealed class MarkMessageAsReadCommandHandler : IRequestHandler<MarkMessageAsReadCommand, Result>
{
    private readonly ICacheService _cacheService;
    private readonly ICurrentUserService _currentUser;

    public MarkMessageAsReadCommandHandler(ICacheService cacheService, ICurrentUserService currentUser)
    {
        _cacheService = cacheService;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(MarkMessageAsReadCommand request, CancellationToken cancellationToken)
    {
        var key = $"message:{request.MessageId}:read:{_currentUser.UserId}";
        await _cacheService.SetAsync(key, true, TimeSpan.FromDays(7), cancellationToken);
        return Result.Success();
    }
}
