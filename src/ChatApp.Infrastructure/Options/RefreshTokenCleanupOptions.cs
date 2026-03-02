namespace ChatApp.Infrastructure.Options;

public sealed class RefreshTokenCleanupOptions
{
    public const string SectionName = "RefreshTokenCleanup";

    public bool Enabled { get; set; } = true;
    public int IntervalHours { get; set; } = 6;
    public int RetentionDays { get; set; } = 30;
}
