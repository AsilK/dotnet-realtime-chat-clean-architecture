using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Users.Commands.UpdateOnlineStatus;

public sealed record UpdateOnlineStatusCommand(bool IsOnline) : IRequest<Result>;
