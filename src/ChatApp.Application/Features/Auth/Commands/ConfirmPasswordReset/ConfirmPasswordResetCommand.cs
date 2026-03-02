using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.ConfirmPasswordReset;

public sealed record ConfirmPasswordResetCommand(string Token, string NewPassword) : IRequest<Result>;
