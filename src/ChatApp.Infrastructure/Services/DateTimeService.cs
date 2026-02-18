using ChatApp.Application.Common.Interfaces;

namespace ChatApp.Infrastructure.Services;

public sealed class DateTimeService : IDateTimeService
{
    public DateTime UtcNow => DateTime.UtcNow;
}
