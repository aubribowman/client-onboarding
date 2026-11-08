using System.Collections.Concurrent;
using OnboardingApi.Models;

namespace OnboardingApi.Data;

/// <summary>
/// Keeps applications in memory for development and demos. Everything resets
/// when the API restarts. ConcurrentDictionary makes it safe for simultaneous requests.
/// </summary>
public class InMemoryApplicationRepository : IApplicationRepository
{
    private readonly ConcurrentDictionary<Guid, ClientApplication> _store = new();
    // Counter for reference numbers (ONB-2026-00001, 00002, ...).
    private int _sequence;

    public Task<ClientApplication> AddAsync(ClientApplication application)
    {
        _store[application.Id] = application;
        return Task.FromResult(application);
    }

    public Task<ClientApplication?> GetAsync(Guid id) =>
        Task.FromResult(_store.GetValueOrDefault(id));

    public Task<IReadOnlyList<ClientApplication>> ListAsync(ApplicationStatus? status)
    {
        IReadOnlyList<ClientApplication> result = _store.Values
            .Where(a => status is null || a.Status == status)
            .OrderByDescending(a => a.SubmittedAt)
            .ToList();
        return Task.FromResult(result);
    }

    public Task UpdateAsync(ClientApplication application)
    {
        _store[application.Id] = application;
        return Task.CompletedTask;
    }

    // Interlocked so two submits at once never get the same number.
    public Task<int> NextSequenceAsync() => Task.FromResult(Interlocked.Increment(ref _sequence));
}
