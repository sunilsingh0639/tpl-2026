import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-tournament-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding:2rem;max-width:700px">
      <h1 style="margin-bottom:0.5rem">Tournament Settings</h1>
      <p style="color:var(--text-muted);margin-bottom:2rem">Venue and contact information displayed on the Tournament page</p>

      <div class="card" style="margin-bottom:1.5rem">
        <h3 style="margin-bottom:1.5rem;color:var(--primary)">🏟️ Venue Details</h3>
        <div class="grid grid-2">
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Venue Name</label>
            <input class="form-control" [(ngModel)]="form.venue_name" placeholder="e.g. Thebri Cricket Ground">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Venue Address</label>
            <input class="form-control" [(ngModel)]="form.venue_address" placeholder="Full address">
          </div>
          <div class="form-group">
            <label class="form-label">Opening Time</label>
            <input class="form-control" [(ngModel)]="form.opening_time" placeholder="e.g. 7:00 AM">
          </div>
          <div class="form-group">
            <label class="form-label">Closing Time</label>
            <input class="form-control" [(ngModel)]="form.closing_time" placeholder="e.g. 7:00 PM">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Google Maps URL</label>
            <input class="form-control" [(ngModel)]="form.maps_url" placeholder="https://maps.google.com/...">
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:1.5rem">
        <h3 style="margin-bottom:1.5rem;color:var(--primary)">📞 Contact Information</h3>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-control" [(ngModel)]="form.phone" placeholder="+91 98765 43210">
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp</label>
            <input class="form-control" [(ngModel)]="form.whatsapp" placeholder="+91 98765 43210">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Phone Available Hours</label>
            <input class="form-control" [(ngModel)]="form.phone_available" placeholder="e.g. 9:00 AM - 6:00 PM">
          </div>
          <div class="form-group">
            <label class="form-label">Primary Email</label>
            <input class="form-control" [(ngModel)]="form.primary_email" placeholder="info@tpl2026.com">
          </div>
          <div class="form-group">
            <label class="form-label">Support Email</label>
            <input class="form-control" [(ngModel)]="form.support_email" placeholder="support@tpl2026.com">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Email Response Time</label>
            <input class="form-control" [(ngModel)]="form.response_time" placeholder="e.g. Within 24 hours">
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-lg" (click)="save()" [disabled]="saving">
        {{ saving ? 'Saving...' : '💾 Save Settings' }}
      </button>
    </div>
  `
})
export class AdminTournamentSettingsComponent implements OnInit {
  form: any = {};
  saving = false;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getTournamentSettings().subscribe(s => this.form = { ...s });
  }

  save() {
    this.saving = true;
    this.api.updateTournamentSettings(this.form).subscribe({
      next: () => { this.saving = false; this.toast.success('Tournament settings saved!'); },
      error: (err) => { this.saving = false; this.toast.error(err.error?.error || 'Failed'); }
    });
  }
}
