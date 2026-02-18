using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Users.Commands.UnblockUser;

public sealed record UnblockUserCommand(Guid TargetUserId) : IRequest<Result>;
