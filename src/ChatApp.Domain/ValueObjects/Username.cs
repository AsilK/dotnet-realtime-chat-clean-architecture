using ChatApp.Domain.Exceptions;

namespace ChatApp.Domain.ValueObjects;

public readonly record struct Username
{
    public string Value { get; }

    public Username(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new DomainException("Username is required.");
        }

        var trimmed = value.Trim();
        if (trimmed.Length is < 3 or > 32)
        {
            throw new DomainException("Username length must be between 3 and 32 characters.");
        }

        Value = trimmed;
    }

    public override string ToString() => Value;
}
