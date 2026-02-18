namespace ChatApp.Application.Common.Interfaces;

public interface IPasswordHasher
{
    string Hash(string input);
    bool Verify(string input, string hash);
}
