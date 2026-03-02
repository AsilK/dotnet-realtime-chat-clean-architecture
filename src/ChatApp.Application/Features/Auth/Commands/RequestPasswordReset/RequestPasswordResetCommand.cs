using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.RequestPasswordReset;

public sealed record RequestPasswordResetCommand(string Email) : IRequest<Result>;
