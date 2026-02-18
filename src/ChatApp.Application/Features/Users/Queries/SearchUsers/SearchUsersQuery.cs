using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Users.Queries.SearchUsers;

public sealed record SearchUsersQuery(string? Term, int PageNumber = 1, int PageSize = 20)
    : IRequest<Result<PaginatedList<UserDto>>>;
