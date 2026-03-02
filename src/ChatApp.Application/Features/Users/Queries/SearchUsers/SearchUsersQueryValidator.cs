using FluentValidation;

namespace ChatApp.Application.Features.Users.Queries.SearchUsers;

public sealed class SearchUsersQueryValidator : AbstractValidator<SearchUsersQuery>
{
    public SearchUsersQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
        RuleFor(x => x.Term).MaximumLength(256).When(x => !string.IsNullOrWhiteSpace(x.Term));
    }
}
