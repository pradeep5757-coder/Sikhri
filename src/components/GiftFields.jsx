import { useId } from 'react';
import { Radio, UnstyledButton } from '@mantine/core';
import { FREQUENCIES, FUNDS, MAX_TEXT, REGIONS, presetsFor } from '../config/constants';
import { FloatingField } from './FloatingField';
import { SegmentedRadio } from './SegmentedRadio';
import { CommentIcon, HeartIcon } from './Icons';

export function FrequencyControl({ d, set }) {
  return (
    <SegmentedRadio
      name="sd-frequency"
      legend="How often"
      value={d.frequency}
      options={FREQUENCIES.map((f) => ({ value: f.id, label: f.label }))}
      onChange={(frequency) => set({ frequency })}
    />
  );
}

export function AmountPicker({ d, set, error }) {
  const r = REGIONS[d.region];
  const errorId = useId();
  const presets = presetsFor(d.frequency).amounts;
  const isPreset = presets.includes(d.amount);
  const shown = d.custom !== '' ? d.custom : d.amount >= 1 ? String(d.amount) : '';

  return (
    <Radio.Group
      name="sd-amount"
      label="Amount"
      value={isPreset && d.custom === '' ? String(d.amount) : null}
      onChange={(v) => set({ amount: Number(v), custom: '' })}
      className={`sd-group${error ? ' has-error' : ''}`}
      classNames={{ label: 'sd-legend' }}
    >
      <div className="sd-amounts">
        {presets.map((a) => (
          <Radio.Card key={a} value={String(a)} className="sd-chip" withBorder={false}>
            {r.symbol}
            {a}
          </Radio.Card>
        ))}
      </div>
      <div className={`sd-prefixed${d.custom && !isPreset ? ' is-on' : ''}`}>
        <span aria-hidden="true">{r.symbol}</span>
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="Other amount"
          aria-label={`Other amount in ${r.currency}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={shown}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, '');
            set({ custom: v, amount: (v && Number(v)) || 0 });
          }}
        />
        <span className="sd-muted" aria-hidden="true">
          {r.currency}
        </span>
      </div>
      {error && (
        <p id={errorId} className="sd-error">
          {error}
        </p>
      )}
    </Radio.Group>
  );
}

export function FundSelect({ d, set }) {
  return <FloatingField as="select" label="Donate to" value={d.fund} data={FUNDS} onChange={(e) => set({ fund: e.currentTarget.value })} />;
}

export function Extras({ d, set, errors }) {
  const ded = d.dedication;
  const setDed = (patch) => set({ dedication: { ...ded, ...patch } });

  if (!d.extrasOpen) {
    return (
      <button type="button" className="sd-link sd-add" onClick={() => set({ extrasOpen: true })}>
        + Add a comment or dedication
      </button>
    );
  }

  return (
    <div className="sd-extras">
      <div className="sd-toggles">
        <UnstyledButton className="sd-toggle" aria-pressed={d.commentOn} onClick={() => set({ commentOn: !d.commentOn, dedicationOn: false })}>
          <CommentIcon />
          Add a comment
        </UnstyledButton>
        <UnstyledButton className="sd-toggle" aria-pressed={d.dedicationOn} onClick={() => set({ commentOn: false, dedicationOn: !d.dedicationOn })}>
          <HeartIcon />
          Dedication
        </UnstyledButton>
      </div>

      {d.commentOn && (
        <FloatingField
          as="textarea"
          label="Comment"
          optional
          hint={`${d.comment.length} of ${MAX_TEXT} characters`}
          rows={3}
          maxLength={MAX_TEXT}
          value={d.comment}
          onChange={(e) => set({ comment: e.currentTarget.value })}
        />
      )}

      {d.dedicationOn && (
        <div className="sd-dedication" role="group" aria-label="Dedication">
          <FloatingField label="Dedication name" error={errors.dedName} autoComplete="off" value={ded.name} onChange={(e) => setDed({ name: e.currentTarget.value })} />
          <FloatingField
            label="Dedication email"
            optional
            type="email"
            inputMode="email"
            autoComplete="off"
            error={errors.dedEmail}
            value={ded.email}
            onChange={(e) => setDed({ email: e.currentTarget.value })}
          />
          <FloatingField as="textarea" label="Dedication message" optional rows={3} maxLength={MAX_TEXT} value={ded.message} onChange={(e) => setDed({ message: e.currentTarget.value })} />
        </div>
      )}
    </div>
  );
}
