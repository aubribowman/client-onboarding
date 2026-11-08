using OnboardingApi.Models;

namespace OnboardingApi.Services;

// A small state machine: which review statuses can follow which.
//   Submitted -> InReview -> Approved | Declined | NeedsInfo
//   NeedsInfo -> InReview (once the client responds)
// Approved and Declined are final. To add a step, add it to the enum and here;
// the detail page picks up new buttons from the next-statuses endpoint.
public static class StatusRules
{
    private static readonly Dictionary<ApplicationStatus, ApplicationStatus[]> Allowed = new()
    {
        [ApplicationStatus.Submitted] = [ApplicationStatus.InReview],
        [ApplicationStatus.InReview] = [ApplicationStatus.NeedsInfo, ApplicationStatus.Approved, ApplicationStatus.Declined],
        [ApplicationStatus.NeedsInfo] = [ApplicationStatus.InReview],
        [ApplicationStatus.Approved] = [],
        [ApplicationStatus.Declined] = []
    };

    public static bool CanMove(ApplicationStatus from, ApplicationStatus to) =>
        Allowed[from].Contains(to);

    public static IReadOnlyList<ApplicationStatus> NextOptions(ApplicationStatus from) => Allowed[from];
}
