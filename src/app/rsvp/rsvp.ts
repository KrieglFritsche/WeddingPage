import { Component, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-rsvp',
  imports: [ReactiveFormsModule],
  templateUrl: './rsvp.html',
  styleUrl: './rsvp.scss',
})
export class Rsvp implements OnInit, OnDestroy {
  private readonly STORAGE_KEY = 'rsvp_submitted';
  private subs = new Subscription();

  isSubmitted = signal(false); // localStorage.getItem(this.STORAGE_KEY) === 'true'
  isOpen = signal(false);

  form = new FormGroup({
    name:          new FormControl('', [Validators.required, Validators.maxLength(100)]),
    attending:     new FormControl('', Validators.required),
    plusone:       new FormControl('', Validators.maxLength(100)),
    plusonename:   new FormControl('', Validators.maxLength(100)),
    phone:         new FormControl('', Validators.maxLength(100)),
    children:      new FormControl(''),
    childrenneeds: new FormControl('', Validators.maxLength(999)),
    food:          new FormControl(''),
    allergies:     new FormControl('', Validators.maxLength(100)),
    show:          new FormControl(''),
    showlength:    new FormControl('', Validators.maxLength(100)),
    showbeamer:    new FormControl(''),
    music:         new FormControl('', Validators.maxLength(100)),
    special:       new FormControl('', Validators.maxLength(999)),
    absence:       new FormControl(''),
  });

  get attending()  { return this.form.get('attending')!.value; }
  get plusone()    { return this.form.get('plusone')!.value; }
  get children()   { return this.form.get('children')!.value; }
  get show()       { return this.form.get('show')!.value; }
  get food()       { return this.form.get('food')!.value; }
  get showbeamer() { return this.form.get('showbeamer')!.value; }
  get absence()    { return this.form.get('absence')!.value; }

  private require(...fields: string[]) {
    for (const f of fields) {
      const c = this.form.get(f)!;
      c.addValidators(Validators.required);
      c.updateValueAndValidity({ emitEvent: false });
    }
  }

  private unrequire(...fields: string[]) {
    for (const f of fields) {
      const c = this.form.get(f)!;
      c.removeValidators(Validators.required);
      c.updateValueAndValidity({ emitEvent: false });
    }
  }

  ngOnInit() {
    this.subs.add(
      this.form.get('attending')!.valueChanges.subscribe(v => {
        if (v === 'Ja') {
          this.require('plusone', 'phone', 'children', 'food', 'allergies', 'show', 'music');
          this.unrequire('absence');
          this.form.patchValue({ absence: '' }, { emitEvent: false });
        } else {
          this.unrequire('plusone', 'phone', 'children', 'food', 'allergies', 'show', 'music', 'plusonename', 'showlength', 'showbeamer');
          this.require('absence');
          this.form.patchValue({
            plusone: '', plusonename: '', phone: '', children: '',
            childrenneeds: '', food: '', allergies: '', show: '',
            showlength: '', showbeamer: '', music: '', special: '',
          }, { emitEvent: false });
        }
      })
    );

    this.subs.add(
      this.form.get('plusone')!.valueChanges.subscribe(v => {
        if (v === 'Ja') {
          this.require('plusonename');
        } else {
          this.unrequire('plusonename');
          this.form.patchValue({ plusonename: '' }, { emitEvent: false });
        }
      })
    );

    this.subs.add(
      this.form.get('children')!.valueChanges.subscribe(v => {
        if (v !== 'Ja') this.form.patchValue({ childrenneeds: '' }, { emitEvent: false });
      })
    );

    this.subs.add(
      this.form.get('show')!.valueChanges.subscribe(v => {
        if (v === 'Ja') {
          this.require('showlength', 'showbeamer');
        } else {
          this.unrequire('showlength', 'showbeamer');
          this.form.patchValue({ showlength: '', showbeamer: '' }, { emitEvent: false });
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) this.close();
  }

  open() {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen.set(false);
    document.body.style.overflow = '';
  }

  submit() {
    if (this.form.invalid) return;
    // localStorage.setItem(this.STORAGE_KEY, 'true');
    this.isSubmitted.set(true);
  }
}
