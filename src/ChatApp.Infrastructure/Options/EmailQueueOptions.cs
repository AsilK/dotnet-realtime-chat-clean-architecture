namespace ChatApp.Infrastructure.Options;

public sealed class EmailQueueOptions
{
    public const string SectionName = "EmailQueue";

    public int Capacity { get; set; } = 1000;
    public int MaxRetryAttempts { get; set; } = 3;
    public int SendTimeoutSeconds { get; set; } = 10;
    public int InitialRetryDelayMilliseconds { get; set; } = 500;
}
