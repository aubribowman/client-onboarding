using OnboardingApi.Models;

namespace OnboardingApi.Data;

// Async on purpose: the in-memory version doesn't need it, but an EF Core
// version will, and swapping implementations won't change any callers.
public interface IApplicationRepository
{
    Task<ClientApplication> AddAsync(ClientApplication application);
    Task<ClientApplication?> GetAsync(Guid id);
    /// <summary>Newest first. Pass null for every status.</summary>
    Task<IReadOnlyList<ClientApplication>> ListAsync(ApplicationStatus? status);
    Task UpdateAsync(ClientApplication application);
    /// <summary>The next number for a reference like ONB-2026-00042.</summary>
    Task<int> NextSequenceAsync();
}
