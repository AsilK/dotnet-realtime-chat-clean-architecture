FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/ChatApp.API/ChatApp.API.csproj", "src/ChatApp.API/"]
COPY ["src/ChatApp.Application/ChatApp.Application.csproj", "src/ChatApp.Application/"]
COPY ["src/ChatApp.Infrastructure/ChatApp.Infrastructure.csproj", "src/ChatApp.Infrastructure/"]
COPY ["src/ChatApp.Domain/ChatApp.Domain.csproj", "src/ChatApp.Domain/"]
RUN dotnet restore "src/ChatApp.API/ChatApp.API.csproj"
COPY . .
RUN dotnet publish "src/ChatApp.API/ChatApp.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ChatApp.API.dll"]
