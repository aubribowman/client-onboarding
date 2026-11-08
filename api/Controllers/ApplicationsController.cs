using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Models;
using OnboardingApi.Services;

namespace OnboardingApi.Controllers;

/// <summary>
/// Endpoints for submitting and reviewing applications. The Angular client
/// calls these through web/src/app/core/onboarding-api.service.ts.
/// </summary>
[ApiController]
[Route("api/applications")]
public class ApplicationsController(OnboardingService service) : ControllerBase
{
    /// <summary>POST /api/applications: the wizard's submit. 201 with the new application, or 400 with field errors.</summary>
    [HttpPost]
    public async Task<ActionResult<ClientApplication>> Submit(OnboardingRequest request)
    {
        // DataAnnotations on the model have already run; these are the extra
        // business rules. Both end up in the same 400 response shape.
        foreach (var (field, message) in service.Validate(request))
            ModelState.AddModelError(field, message);

        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var created = await service.SubmitAsync(request);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    /// <summary>GET /api/applications?status=InReview: the review queue, newest first. Omit status for all.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ApplicationSummary>>> List([FromQuery] ApplicationStatus? status) =>
        Ok(await service.ListAsync(status));

    /// <summary>GET /api/applications/{id}: one full application.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientApplication>> Get(Guid id) =>
        await service.GetAsync(id) is { } application ? Ok(application) : NotFound();

    /// <summary>GET /api/applications/{id}/next-statuses: the statuses allowed next.
    /// The detail page shows one decision button per item.</summary>
    [HttpGet("{id:guid}/next-statuses")]
    public async Task<ActionResult<IReadOnlyList<ApplicationStatus>>> NextStatuses(Guid id) =>
        await service.GetAsync(id) is { } application
            ? Ok(StatusRules.NextOptions(application.Status))
            : NotFound();

    /// <summary>PATCH /api/applications/{id}/status: a reviewer decision.
    /// 409 if StatusRules doesn't allow the move; 400 if Needs info has no note.</summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ClientApplication>> ChangeStatus(Guid id, StatusUpdateRequest update)
    {
        var application = await service.GetAsync(id);
        if (application is null) return NotFound();

        if (!StatusRules.CanMove(application.Status, update.Status))
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Status change not allowed",
                detail: $"An application that is {application.Status} can't move to {update.Status}.");

        if (update.Status == ApplicationStatus.NeedsInfo && string.IsNullOrWhiteSpace(update.Note))
        {
            ModelState.AddModelError(nameof(update.Note), "Say what information the client needs to provide.");
            return ValidationProblem(ModelState);
        }

        return Ok(await service.ChangeStatusAsync(application, update));
    }
}
