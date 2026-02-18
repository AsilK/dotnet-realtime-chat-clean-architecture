using System.Security.Cryptography;
using System.Text;

namespace ChatApp.Application.Features.Auth;

internal static class TokenHashing
{
    public static string Sha256(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }
}
