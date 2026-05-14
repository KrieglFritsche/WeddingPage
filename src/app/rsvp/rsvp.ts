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
  // private readonly STORAGE_KEY = 'rsvp_submitted';
  private subs = new Subscription();

  isSubmitted = signal(false); // localStorage.getItem(this.STORAGE_KEY) === 'true'
  isOpen = signal(false);
  isWiggling = signal(false);

  private wiggleInterval: ReturnType<typeof setInterval> | null = null;

  form = new FormGroup({
    website:       new FormControl(''),
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

  private readonly fieldLabels: Record<string, string> = {
    name:        'Name',
    attending:   'Teilnahme',
    absence:     'Was trifft zu?',
    plusone:     'Begleitung',
    plusonename: 'Name der Begleitung',
    phone:       'Bevorzugter Kontakt (Email/Tel.)',
    children:    'Kinder dabei?',
    food:        'Essen',
    allergies:   'Allergien',
    show:        'Beitrag geplant?',
    showlength:  'Beitrag Länge',
    showbeamer:  'Beamer oder Leinwand benötigt?',
    music:       'Musikwunsch',
  };

  get missingFields(): string[] {
    return Object.entries(this.fieldLabels)
      .filter(([key]) => this.form.get(key)?.errors?.['required'])
      .map(([, label]) => label);
  }

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

  private startWiggleTimer() {
    this.wiggleInterval = setInterval(() => {
      this.isWiggling.set(true);
      setTimeout(() => this.isWiggling.set(false), 700);
    }, 20000);
  }

  ngOnInit() {
    this.startWiggleTimer();
    this.subs.add(
      this.form.get('attending')!.valueChanges.subscribe(v => {
        if (v === 'Ja') {
          this.require('plusone', 'phone', 'children', 'food', 'show');
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
    if (this.wiggleInterval) clearInterval(this.wiggleInterval);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) this.close();
  }

  open() {
    this.isOpen.set(true);
    this.isWiggling.set(false);
    document.body.style.overflow = 'hidden';
    if (this.wiggleInterval) clearInterval(this.wiggleInterval);
  }

  close() {
    this.isOpen.set(false);
    document.body.style.overflow = '';
    this.form.reset();
    this.startWiggleTimer();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => {
        const el = document.querySelector('.rsvp-form .ng-invalid');
        el?.closest('.form-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
      return;
    }
    if (this.form.value.website) return;

    const v = this.form.value;
    const body = new URLSearchParams({
      'entry.877086558':  v.name            ?? '',
      'entry.137018687':  v.attending        ?? '',
      'entry.949345539':  v.absence          ?? '',
      'entry.1269124808': v.plusone          ?? '',
      'entry.1938261187': v.plusonename      ?? '',
      'entry.1839326576': v.phone            ?? '',
      'entry.869140314':  v.children         ?? '',
      'entry.117133777':  v.childrenneeds    ?? '',
      'entry.735818631':  v.food             ?? '',
      'entry.1885540145': v.allergies        ?? '',
      'entry.1951095919': v.show             ?? '',
      'entry.1059383757': v.showlength       ?? '',
      'entry.389945756':  v.showbeamer       ?? '',
      'entry.1791217335': v.music            ?? '',
      'entry.916521135':  v.special          ?? '',
      'entry.2606285':    '',
    });

    fetch('https://docs.google.com/forms/d/e/1FAIpQLSfYS7Hkr20j7eVfEgQMu8OW5C0I4sjGrPU30ItKU5p6ya5kTw/formResponse', {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    // localStorage.setItem(this.STORAGE_KEY, 'true');
    this.isSubmitted.set(true);
  }
}
