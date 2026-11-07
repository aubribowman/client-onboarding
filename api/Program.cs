using System.Text.Json.Serialization;
using OnboardingApi.Data;
using OnboardingApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers()
    // Send enums as "RothIra" instead of 3, which is easier to read on the client.
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IApplicationRepository, InMemoryApplicationRepository>();
builder.Services.AddScoped<OnboardingService>();

// Only needed if you call the API directly from the Angular dev server
// instead of going through its proxy (see web/proxy.conf.json).
builder.Services.AddCors(o => o.AddPolicy("AngularDev", p =>
    p.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("AngularDev");
    using var scope = app.Services.CreateScope();
    await SeedData.LoadAsync(scope.ServiceProvider.GetRequiredService<OnboardingService>());
}

app.MapControllers();
app.Run();
