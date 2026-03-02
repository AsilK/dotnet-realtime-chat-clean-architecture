using ChatApp.API.Middleware;

namespace ChatApp.API.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseApiPipeline(this IApplicationBuilder app)
    {
        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.UseMiddleware<SecurityHeadersMiddleware>();

        return app;
    }
}
