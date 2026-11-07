using OnboardingApi.Models;

namespace OnboardingApi.Services;

// The questions live on the server so the client and the API always score
// against the same version. Each answer is worth 1 (cautious) to 4 (bold).
public static class RiskQuestionnaire
{
    public static readonly IReadOnlyList<RiskQuestion> Questions =
    [
        new("horizon", "When do you expect to start withdrawing from this account?",
        [
            new(1, "Within 2 years"), new(2, "In 3 to 5 years"),
            new(3, "In 6 to 10 years"), new(4, "More than 10 years from now")
        ]),
        new("drawdown", "Your portfolio drops 20% in a month. What do you do?",
        [
            new(1, "Sell everything"), new(2, "Sell some to limit losses"),
            new(3, "Hold and wait"), new(4, "Buy more while prices are low")
        ]),
        new("goal", "What matters most for this money?",
        [
            new(1, "Protecting what I have"), new(2, "Steady income"),
            new(3, "Balanced growth"), new(4, "Maximum long-term growth")
        ]),
        new("experience", "How would you describe your investing experience?",
        [
            new(1, "None"), new(2, "Savings accounts and CDs"),
            new(3, "Mutual funds or ETFs"), new(4, "Individual stocks, options or alternatives")
        ]),
        new("liquidity", "How much of your savings is this deposit?",
        [
            new(1, "More than 75%"), new(2, "50% to 75%"),
            new(3, "25% to 50%"), new(4, "Less than 25%")
        ])
    ];

    public static RiskResult Score(IEnumerable<RiskAnswer> answers)
    {
        var score = answers.Sum(a => a.Value);
        var profile = score switch
        {
            <= 8 => RiskProfile.Conservative,
            <= 12 => RiskProfile.Moderate,
            <= 16 => RiskProfile.Growth,
            _ => RiskProfile.Aggressive
        };
        return new RiskResult(score, profile);
    }

    // Returns problems as (field, message) pairs so the controller can add
    // them to ModelState and the client sees one consistent error shape.
    public static IEnumerable<(string Field, string Message)> Validate(IReadOnlyCollection<RiskAnswer> answers)
    {
        foreach (var q in Questions)
        {
            var matches = answers.Where(a => a.QuestionId == q.Id).ToList();
            if (matches.Count == 0)
                yield return ($"RiskAnswers.{q.Id}", $"Answer the question: {q.Text}");
            else if (matches.Count > 1)
                yield return ($"RiskAnswers.{q.Id}", "Each question can only be answered once.");
        }

        foreach (var a in answers.Where(a => Questions.All(q => q.Id != a.QuestionId)))
            yield return ($"RiskAnswers.{a.QuestionId}", "Unknown question.");
    }
}
