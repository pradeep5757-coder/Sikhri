import { Radio } from '@mantine/core';

/**
 * Pill-style segmented choice built on Mantine Radio.Group + Radio.Card.
 * Used for "How often" and the Gift Aid yes/no questions.
 * `value` may be '' (nothing chosen yet).
 */
export function SegmentedRadio({ name, legend, hint, value, options, error, onChange }) {
  return (
    <Radio.Group
      name={name}
      value={value}
      onChange={onChange}
      label={legend}
      description={hint}
      error={error}
      inputWrapperOrder={['label', 'description', 'input', 'error']}
      className={`sd-group${error ? ' has-error' : ''}`}
      classNames={{ label: 'sd-legend', description: 'sd-group-hint', error: 'sd-error' }}
    >
      <div className="sd-seg">
        {options.map((o) => (
          <Radio.Card
            key={o.value}
            value={o.value}
            className="sd-seg-opt"
            withBorder={false}
            aria-invalid={error ? true : undefined}
          >
            {o.label}
          </Radio.Card>
        ))}
      </div>
    </Radio.Group>
  );
}

export const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];
