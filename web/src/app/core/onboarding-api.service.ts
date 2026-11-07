import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApplicationStatus,
  ApplicationSummary,
  ClientApplication,
  OnboardingRequest,
  RiskQuestion
} from './models';

// Relative URLs: in development, proxy.conf.json forwards /api to the .NET app.
@Injectable({ providedIn: 'root' })
export class OnboardingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getRiskQuestions(): Observable<RiskQuestion[]> {
    return this.http.get<RiskQuestion[]>(`${this.base}/risk-questions`);
  }

  submit(request: OnboardingRequest): Observable<ClientApplication> {
    return this.http.post<ClientApplication>(`${this.base}/applications`, request);
  }

  list(status: ApplicationStatus | null): Observable<ApplicationSummary[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<ApplicationSummary[]>(`${this.base}/applications`, { params });
  }

  get(id: string): Observable<ClientApplication> {
    return this.http.get<ClientApplication>(`${this.base}/applications/${id}`);
  }

  nextStatuses(id: string): Observable<ApplicationStatus[]> {
    return this.http.get<ApplicationStatus[]>(`${this.base}/applications/${id}/next-statuses`);
  }

  changeStatus(id: string, status: ApplicationStatus, note: string | null): Observable<ClientApplication> {
    return this.http.patch<ClientApplication>(`${this.base}/applications/${id}/status`, { status, note });
  }
}
