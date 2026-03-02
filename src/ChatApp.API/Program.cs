using ChatApp.API.Extensions;
using ChatApp.API.Hubs;
using ChatApp.Infrastructure.Persistence;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.Seq(builder.Configuration["Serilog:SeqUrl"] ?? "http://localhost:5341")
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    const int maxMigrationAttempts = 10;

    for (var attempt = 1; attempt <= maxMigrationAttempts; attempt++)
    {
        try
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await ApplicationDbContextSeed.SeedAsync(dbContext);
            break;
        }
        catch (Exception ex)
        {
            if (attempt == maxMigrationAttempts)
            {
                app.Logger.LogWarning(ex, "Database migration/seed skipped after retry budget was exhausted.");
                break;
            }

            app.Logger.LogWarning(ex, "Database migration/seed attempt {Attempt}/{MaxAttempts} failed. Retrying...", attempt, maxMigrationAttempts);
            await Task.Delay(TimeSpan.FromSeconds(2));
        }
    }
}

app.UseSerilogRequestLogging();
app.UseApiPipeline();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("DefaultCors");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");

app.MapControllers().RequireRateLimiting("api");
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

public partial class Program;
