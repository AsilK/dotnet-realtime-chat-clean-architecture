using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Users.Commands.UpdateProfile;

public sealed record UpdateProfileCommand(string DisplayName, string? Bio, string? AvatarUrl) : IRequest<Result<UserDto>>;
