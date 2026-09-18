import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';
import { GalleryItem, Season } from '../../../types/models';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div style="padding:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
        <div><h1>Gallery</h1><p style="color:var(--text-muted)">{{ items.length }} images</p></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select class="form-control" style="width:auto" [(ngModel)]="filterSeason" (ngModelChange)="load()">
            <option value="">All Seasons</option>
            <option value="GENERAL">General</option>
            <option *ngFor="let s of seasons" [value]="s.season_id">{{ s.season_name }}</option>
          </select>
          <button class="btn btn-primary" (click)="showUpload=true">+ Upload Images</button>
        </div>
      </div>

      <div class="grid grid-4">
        <div class="card" *ngFor="let item of items" style="padding:0;overflow:hidden">
          <div style="position:relative;aspect-ratio:4/3;background:var(--bg-card2)">
            <img *ngIf="item.image_path" [src]="'http://localhost:3000' + item.image_path"
              style="width:100%;height:100%;object-fit:cover">
            <div *ngIf="!item.image_path" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem">🖼️</div>
            <div style="position:absolute;top:8px;right:8px">
              <span class="badge" [class]="(item.active === 'true' || item.active === true) ? 'badge-active' : 'badge-inactive'" style="font-size:0.65rem">
                {{ (item.active === 'true' || item.active === true) ? 'Active' : 'Hidden' }}
              </span>
            </div>
          </div>
          <div style="padding:0.75rem">
            <div style="font-weight:600;font-size:0.85rem;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ item.title }}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px">{{ item.season_id }} · {{ item.category }}</div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-warning btn-sm" style="flex:1;font-size:0.72rem" (click)="toggleActive(item)">
                {{ (item.active === 'true' || item.active === true) ? 'Hide' : 'Show' }}
              </button>
              <button class="btn btn-danger btn-sm" style="flex:1;font-size:0.72rem" (click)="confirmDel(item)">Delete</button>
            </div>
          </div>
        </div>
        <div *ngIf="items.length === 0" class="empty-state" style="grid-column:1/-1">
          <div class="icon">🖼️</div><h3>No gallery images</h3>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div class="modal-overlay" *ngIf="showUpload" (click)="showUpload=false">
      <div class="modal" style="max-width:600px;width:100%" (click)="$event.stopPropagation()">
        <h2 class="modal-title">Upload Images</h2>
        <div class="form-group">
          <label class="form-label">Season</label>
          <select class="form-control" [(ngModel)]="uploadForm.season_id">
            <option value="GENERAL">General</option>
            <option *ngFor="let s of seasons" [value]="s.season_id">{{ s.season_name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-control" [(ngModel)]="uploadForm.category">
            <option>GENERAL</option><option>MATCH</option><option>CELEBRATION</option>
            <option>FINAL</option><option>CEREMONY</option><option>TEAM</option><option>ACTION</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Images (max 20)</label>
          <input class="form-control" type="file" accept="image/*" multiple (change)="onFiles($event)">
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">{{ selectedFiles.length }} file(s) selected</div>
        </div>
        <div *ngIf="uploadError" style="color:var(--danger);font-size:0.88rem;margin-bottom:1rem">❌ {{ uploadError }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="showUpload=false">Cancel</button>
          <button class="btn btn-primary" (click)="upload()" [disabled]="uploading || !selectedFiles.length">
            {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
      </div>
    </div>

    <app-confirm-modal [visible]="showDel" title="Delete Image" message="Delete this gallery image permanently?"
      confirmText="Delete" confirmClass="danger" (confirmed)="doDelete()" (cancelled)="showDel=false">
    </app-confirm-modal>
  `
})
export class AdminGalleryComponent implements OnInit {
  items: GalleryItem[] = [];
  seasons: Season[] = [];
  filterSeason = '';
  showUpload = false;
  uploadForm = { season_id: 'GENERAL', category: 'GENERAL' };
  selectedFiles: File[] = [];
  uploading = false; uploadError = '';
  showDel = false; delTarget: GalleryItem | null = null;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getAdminSeasons().subscribe(s => this.seasons = s);
    this.load();
  }

  load() {
    this.api.getAdminGallery(this.filterSeason || undefined).subscribe(items => this.items = items);
  }

  onFiles(e: any) { this.selectedFiles = Array.from(e.target.files || []); }

  upload() {
    if (!this.selectedFiles.length) return;
    this.uploading = true; this.uploadError = '';
    const fd = new FormData();
    fd.append('season_id', this.uploadForm.season_id);
    fd.append('category', this.uploadForm.category);
    this.selectedFiles.forEach(f => fd.append('images', f));
    this.api.uploadGallery(fd).subscribe({
      next: (res) => {
        this.uploading = false; this.showUpload = false;
        this.toast.success(`${res.length} image(s) uploaded`);
        this.selectedFiles = []; this.load();
      },
      error: (err) => { this.uploading = false; this.uploadError = err.error?.error || 'Upload failed'; }
    });
  }

  toggleActive(item: GalleryItem) {
    const active = !(item.active === 'true' || item.active === true);
    this.api.updateGalleryItem(item.gallery_id, { ...item, active: String(active) }).subscribe({
      next: () => { this.toast.success('Updated'); this.load(); },
      error: (err) => this.toast.error(err.error?.error || 'Failed')
    });
  }

  confirmDel(item: GalleryItem) { this.delTarget = item; this.showDel = true; }
  doDelete() {
    if (!this.delTarget) return;
    this.api.deleteGalleryItem(this.delTarget.gallery_id).subscribe({
      next: () => { this.toast.success('Deleted'); this.showDel = false; this.load(); },
      error: (err) => this.toast.error(err.error?.error || 'Delete failed')
    });
  }
}
