namespace ChatApp.Domain.Common;

public interface IDomainEvent
{
    DateTime OccurredOnUtc { get; }
}
