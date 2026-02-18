using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Users.Queries.GetUserById;

public sealed record GetUserByIdQuery(Guid UserId) : IRequest<Result<UserDto>>;
