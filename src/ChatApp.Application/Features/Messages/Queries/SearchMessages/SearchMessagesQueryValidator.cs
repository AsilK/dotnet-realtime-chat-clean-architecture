using FluentValidation;

namespace ChatApp.Application.Features.Messages.Queries.SearchMessages;

public sealed class SearchMessagesQueryValidator : AbstractValidator<SearchMessagesQuery>
{
    public SearchMessagesQueryValidator()
    {
        RuleFor(x => x.RoomId).NotEmpty();
        RuleFor(x => x.Term).NotEmpty().MaximumLength(256);
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
