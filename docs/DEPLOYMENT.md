# Deployment

## Docker Compose

```bash
docker compose up -d
```

Services:
- API
- PostgreSQL
- Redis
- Seq

## Environment Variables

- `ConnectionStrings__DefaultConnection`
- `Redis__ConnectionString`
- `JwtSettings__Secret`
- `JwtSettings__Issuer`
- `JwtSettings__Audience`

`JwtSettings__Secret` değeri HS256 için en az 32 byte (256 bit) olmalıdır.

## Migration Strategy

- Initial migration is included in `src/ChatApp.Infrastructure/Persistence/Migrations`.
- App seeds baseline data on startup.

## Health Checks

- `/health/live`
- `/health/ready`

## Monitoring

- Serilog Console and Seq sink.

## Production Checklist

- Set strong JWT secret.
- Use HTTPS and strict CORS.
- Configure managed PostgreSQL and Redis.
- Enable backup and restore process.
