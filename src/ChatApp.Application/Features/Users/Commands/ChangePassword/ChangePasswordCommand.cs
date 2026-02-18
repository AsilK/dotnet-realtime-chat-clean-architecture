using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Users.Commands.ChangePassword;

public sealed record ChangePasswordCommand(string CurrentPassword, string NewPassword) : IRequest<Result>;
