using System.Security.Cryptography;

namespace ChatApp.Application.Features.Auth;

internal static class AuthSecurityTokenFactory
{
    public static string GenerateToken(int byteLength = 32)
    {
        var bytes = RandomNumberGenerator.GetBytes(byteLength);
        var token = Convert.ToBase64String(bytes);

        return token.Replace('+', '-').Replace('/', '_').Replace("=", string.Empty);
    }
}
