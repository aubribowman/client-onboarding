using System.Text.Json.Serialization;
using OnboardingApi.Data;
using OnboardingApi.Services;

// App startup: registers services, then maps the controllers in Controllers/.
// Run with `dotnet run` from the api folder (http://localhost:5044).
var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers()
    // Send enums as "RothIra" instead of 3, which is easier to read on the client.
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// TimeProvider is injected (instead of calling DateTime.Now) so tests can fix the clock.
builder.Services.AddSingleton(TimeProvider.System);
// Singleton because the in-memory store must outlive each request. Data is
// lost when the app stops; swap in a database-backed repository to keep it.
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
    // Development only: load a few sample applications so the queue has data.
    using var scope = app.Services.CreateScope();
    await SeedData.LoadAsync(scope.ServiceProvider.GetRequiredService<OnboardingService>());
}

app.MapControllers();
app.Run();
