using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Models;
using OnboardingApi.Services;

namespace OnboardingApi.Controllers;

[ApiController]
[Route("api/risk-questions")]
public class RiskQuestionsController : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<RiskQuestion>> Get() => Ok(RiskQuestionnaire.Questions);
}
