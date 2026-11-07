using System.Collections.Concurrent;
using OnboardingApi.Models;

namespace OnboardingApi.Data;

public class InMemoryApplicationRepository : IApplicationRepository
{
    private readonly ConcurrentDictionary<Guid, ClientApplication> _store = new();
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

    public Task<int> NextSequenceAsync() => Task.FromResult(Interlocked.Increment(ref _sequence));
}
