using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.Register;

public sealed record RegisterCommand(string Email, string Username, string Password, string DisplayName)
    : IRequest<Result<AuthResponseDto>>;
