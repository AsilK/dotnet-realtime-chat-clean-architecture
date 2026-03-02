using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.RequestEmailVerification;

public sealed record RequestEmailVerificationCommand(string Email) : IRequest<Result>;
