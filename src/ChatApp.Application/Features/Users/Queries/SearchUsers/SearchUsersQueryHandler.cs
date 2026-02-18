using AutoMapper;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Users.Queries.SearchUsers;

public sealed class SearchUsersQueryHandler : IRequestHandler<SearchUsersQuery, Result<PaginatedList<UserDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SearchUsersQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<Result<PaginatedList<UserDto>>> Handle(SearchUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _unitOfWork.Users.SearchAsync(request.Term, request.PageNumber, request.PageSize, cancellationToken);
        var mapped = users.Items.Select(_mapper.Map<UserDto>).ToArray();
        return Result.Success(new PaginatedList<UserDto>(mapped, users.PageNumber, users.PageSize, users.TotalCount));
    }
}
