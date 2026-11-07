using OnboardingApi.Models;

namespace OnboardingApi.Data;

// Async on purpose: the in-memory version doesn't need it, but an EF Core
// version will, and swapping implementations won't change any callers.
public interface IApplicationRepository
{
    Task<ClientApplication> AddAsync(ClientApplication application);
    Task<ClientApplication?> GetAsync(Guid id);
    Task<IReadOnlyList<ClientApplication>> ListAsync(ApplicationStatus? status);
    Task UpdateAsync(ClientApplication application);
    Task<int> NextSequenceAsync();
}
