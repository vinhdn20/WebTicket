#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG PASSWORD_ENV_SEEDED
RUN dotnet dev-certs https -ep /https/aspnetapp.pfx -p ${PASSWORD_ENV_SEEDED}
WORKDIR /src
COPY ["WebTicket/WebTicket.csproj", "WebTicket/"]
COPY ["Common/Common.csproj", "Common/"]
COPY ["Repositories/Repositories.csproj", "Repositories/"]
COPY ["Services/Services.csproj", "Services/"]
RUN dotnet restore "WebTicket/WebTicket.csproj"
COPY . .
WORKDIR "/src/WebTicket"
RUN dotnet build "WebTicket.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "WebTicket.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --chmod=0755 --from=build /https/*
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WebTicket.dll"]