using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.Users.Commands.BlockUser;

public sealed class BlockUserCommandHandler : IRequestHandler<BlockUserCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public BlockUserCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(BlockUserCommand request, CancellationToken cancellationToken)
    {
        if (request.TargetUserId == _currentUser.UserId)
        {
            return Result.Failure("You cannot block yourself.");
        }

        if (await _unitOfWork.Users.IsBlockedAsync(_currentUser.UserId, request.TargetUserId, cancellationToken))
        {
            return Result.Success();
        }

        await _unitOfWork.Users.AddBlockAsync(UserBlock.Create(_currentUser.UserId, request.TargetUserId), cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
