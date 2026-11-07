# Client Onboarding Workflow

A full-stack onboarding tool for a fictional wealth management firm, Harbor Point. An advisor walks a new client through a five-step application, the client gets a risk profile from a short questionnaire, and operations staff review the application in a queue and approve it, decline it or request more information.

Built with **Angular 19** and **ASP.NET Core 8 Web API**.

<!-- Add screenshots here: wizard, risk step, review queue, detail page -->

## What it does

- **Multi-step application** with per-step validation, a progress rail you can use to jump back to finished steps, and an editable summary before submitting.
- **Risk questionnaire** served by the API, with a live profile preview (Conservative, Moderate, Growth, Aggressive) that updates as answers change.
- **Draft autosave**: progress is saved in the browser, so refreshing the page doesn’t lose a half-finished application.
- **Review queue** with status filtering, and a detail page with a status history timeline.
- **Review workflow rules** enforced on the server: an application has to be in review before it can be approved, and requesting info requires a note.

## Tech stack

| Layer | Tools |
| --- | --- |
| Front end | Angular 19 (standalone components, signals, new `@if`/`@for` control flow), typed reactive forms, RxJS, SCSS |
| Back end | ASP.NET Core 8 Web API, controllers, DataAnnotations validation, dependency injection |
| Testing | Jasmine + Karma (validators, scoring, form-to-request mapping, app shell) |

## Running it locally

You need the [.NET 8 SDK](https://dotnet.microsoft.com/download) and [Node.js 20+](https://nodejs.org).

```bash
# Terminal 1: the API, on http://localhost:5044
cd api
dotnet run

# Terminal 2: the Angular app, on http://localhost:4200
cd web
npm install
npm start
```

The Angular dev server proxies `/api` to the .NET app (see `web/proxy.conf.json`), so there’s no CORS setup to worry about. The API seeds three sample applications in development so the review queue isn’t empty.

Run the front-end tests with `npm test` in `web`. `api/OnboardingApi.http` has ready-made requests for every endpoint, including one that fails validation on purpose.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/risk-questions` | Questionnaire the wizard renders |
| POST | `/api/applications` | Submit an application. Returns 201, or 400 with field errors |
| GET | `/api/applications?status=` | Queue, optionally filtered by status |
| GET | `/api/applications/{id}` | Full application with history |
| GET | `/api/applications/{id}/next-statuses` | Which decisions are allowed from the current status |
| PATCH | `/api/applications/{id}/status` | Record a decision. Returns 409 if the move isn’t allowed |

## Design decisions

**The server is the source of truth for business rules.** The Angular app validates for a fast, friendly experience, but the API re-checks everything: field formats, minimum age, that every risk question was answered once, and that the client accepted the agreement. The client’s risk score is only a preview; the stored score is calculated by the API.

**Review statuses are a small state machine** (`StatusRules.cs`). The API also exposes the allowed next statuses, so the UI shows only valid actions instead of duplicating the rules in TypeScript.

**One typed form, split across steps.** The wizard owns a single `FormGroup` with a nested group per step, and each step component receives only its own group. The risk questions arrive from the API at runtime, so they live in a `FormRecord` that gets one control per question.

**Conditional validation.** The employer field is only required for employed or self-employed clients. The financial step swaps its validators when employment status changes.

**Cancelling stale requests.** The review queue uses `switchMap` when the filter changes, so a slow response for an old filter can’t replace newer results.

**Repository interface.** Data access goes through `IApplicationRepository`. It’s backed by an in-memory store today, and its async signatures are already shaped for EF Core, so a database can be added without changing the service or controllers.

## Project structure

```
api/
  Controllers/   HTTP endpoints
  Services/      Onboarding rules, risk scoring, status rules
  Data/          Repository interface, in-memory store, seed data
  Models/        Request DTOs and stored records
web/src/app/
  core/          API service, models, validators, display labels, risk scoring
  wizard/        The five-step application and its step components
  applications/  Review queue and application detail
  shared/        Field error messages
```

## Roadmap

- Persist applications in SQL Server with EF Core
- Document upload (ID and proof of address)
- Sign-in with separate advisor and reviewer roles
- xUnit tests for the API rules
- Deploy to Azure App Service

All client data in this project is fictional.
