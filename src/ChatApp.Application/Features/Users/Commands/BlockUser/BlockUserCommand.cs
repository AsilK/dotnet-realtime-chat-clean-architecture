using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Users.Commands.BlockUser;

public sealed record BlockUserCommand(Guid TargetUserId) : IRequest<Result>;
