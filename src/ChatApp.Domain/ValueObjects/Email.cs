using System.Text.RegularExpressions;
using ChatApp.Domain.Exceptions;

namespace ChatApp.Domain.ValueObjects;

public readonly record struct Email
{
    private static readonly Regex EmailRegex = new(
        "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !EmailRegex.IsMatch(value))
        {
            throw new DomainException("Invalid email address.");
        }

        Value = value.Trim().ToLowerInvariant();
    }

    public override string ToString() => Value;
}
