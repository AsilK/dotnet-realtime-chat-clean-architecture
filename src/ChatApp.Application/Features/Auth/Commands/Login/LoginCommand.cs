using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.Login;

public sealed record LoginCommand(string EmailOrUsername, string Password) : IRequest<Result<AuthResponseDto>>;
