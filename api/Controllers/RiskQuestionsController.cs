using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Models;
using OnboardingApi.Services;

namespace OnboardingApi.Controllers;

/// <summary>GET /api/risk-questions: the questionnaire the wizard shows on step 3.</summary>
[ApiController]
[Route("api/risk-questions")]
public class RiskQuestionsController : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<RiskQuestion>> Get() => Ok(RiskQuestionnaire.Questions);
}
