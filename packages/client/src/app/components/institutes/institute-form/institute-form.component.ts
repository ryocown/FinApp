import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InstituteService } from '../../../services/institute';
import { InstituteTypes, SUPPORTED_INSTITUTES } from '@finapp/shared/models';

@Component({
    selector: 'app-institute-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule
    ],
    template: `
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2">
        <!-- Supported Institute Quick Select -->
        <mat-form-field>
            <mat-label>Quick Select (Optional)</mat-label>
            @if (selectedLogo) {
                <div matPrefix class="flex items-center justify-center pointer-events-none" style="width: 32px; height: 32px; margin: 0 12px; vertical-align: middle; align-items: center; display: flex;">
                    <img [src]="selectedLogo" class="max-w-full max-h-full object-contain theme-logo" 
                         alt="Logo">
                </div>
            }
            <mat-select (selectionChange)="onSupportedSelect($event.value)">
                <mat-option [value]="null">-- Custom --</mat-option>
                @for (inst of supportedInstitutes; track inst.instituteId) {
                    <mat-option [value]="inst">{{ inst.displayName }}</mat-option>
                }
            </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
          @if (form.get('name')?.hasError('duplicate')) {
            <mat-error>Name already exists</mat-error>
          }
           @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
            <mat-label>Type</mat-label>
            <mat-select formControlName="type">
                @for (type of instituteTypes; track type) {
                    <mat-option [value]="type">{{ type }}</mat-option>
                }
            </mat-select>
        </mat-form-field>
      </form>
  `,
    styles: [`
    mat-form-field { width: 100%; }
    
    /* Logo Styling */
    .theme-logo {
        transition: filter 0.3s ease;
        /* Light Theme Default: Dark Gray to match text */
        filter: grayscale(100%) opacity(0.7);
    }

    /* Dark Theme Override: Invert and Brighten */
    :host-context(.dark-theme) .theme-logo {
        filter: grayscale(100%) invert(1) contrast(0.2) brightness(1.7);
    }
  `]
})
export class InstituteFormComponent {
    private fb = inject(FormBuilder);
    private instituteService = inject(InstituteService);

    readonly supportedInstitutes = SUPPORTED_INSTITUTES;
    readonly instituteTypes = Object.values(InstituteTypes);

    form = this.fb.group({
        name: ['', [Validators.required, this.uniqueNameValidator()]],
        type: [InstituteTypes.OTHER, Validators.required],
        supportedInstituteId: ['']
    });

    selectedLogo: string | null = null;

    get valid() { return this.form.valid; }
    get value() { return this.form.value; }
    get invalid() { return this.form.invalid; }

    onSupportedSelect(inst: any) {
        if (inst) {
            if (!this.form.get('name')?.value) {
                this.form.patchValue({
                    name: inst.displayName
                });
            }
            this.form.patchValue({
                type: inst.type,
                supportedInstituteId: inst.supportedInstituteId
            });
            this.selectedLogo = inst.logo || null;
        } else {
            this.selectedLogo = null;
            this.form.patchValue({
                supportedInstituteId: ''
            });
        }
    }

    uniqueNameValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value?.trim().toLowerCase();
            if (!value) return null;
            const exists = this.instituteService.institutes().some(i => i.name.toLowerCase() === value);
            return exists ? { duplicate: true } : null;
        };
    }
}
