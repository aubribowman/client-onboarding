using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Models;
using OnboardingApi.Services;

namespace OnboardingApi.Controllers;

[ApiController]
[Route("api/applications")]
public class ApplicationsController(OnboardingService service) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ClientApplication>> Submit(OnboardingRequest request)
    {
        foreach (var (field, message) in service.Validate(request))
            ModelState.AddModelError(field, message);

        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var created = await service.SubmitAsync(request);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ApplicationSummary>>> List([FromQuery] ApplicationStatus? status) =>
        Ok(await service.ListAsync(status));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientApplication>> Get(Guid id) =>
        await service.GetAsync(id) is { } application ? Ok(application) : NotFound();

    [HttpGet("{id:guid}/next-statuses")]
    public async Task<ActionResult<IReadOnlyList<ApplicationStatus>>> NextStatuses(Guid id) =>
        await service.GetAsync(id) is { } application
            ? Ok(StatusRules.NextOptions(application.Status))
            : NotFound();

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
