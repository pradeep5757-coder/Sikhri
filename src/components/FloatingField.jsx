import { useState } from 'react';
import { NativeSelect, Textarea, TextInput } from '@mantine/core';

const CLASS_NAMES = {
  root: 'sd-float',
  label: 'sd-float-label',
  input: 'sd-input',
  error: 'sd-error',
  description: 'sd-hint',
  section: 'sd-select-chevron',
};

const Chevron = () => (
  <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
    <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const COMPONENTS = { input: TextInput, textarea: Textarea, select: NativeSelect };

/**
 * Mantine input with the live page's floating label.
 * The label sits inside the box and shrinks to the top when the field is focused or filled.
 * A hint shows under the field; an error replaces the hint.
 */
export function FloatingField({ as = 'input', label, optional, hint, error, value, onFocus, onBlur, ...rest }) {
  const [focused, setFocused] = useState(false);
  const Component = COMPONENTS[as];
  const isSelect = as === 'select';
  const floating = isSelect || focused || String(value ?? '') !== '';

  return (
    <Component
      classNames={CLASS_NAMES}
      label={
        <>
          {label}
          {optional && <span className="sd-optional"> (optional)</span>}
        </>
      }
      description={error ? undefined : hint}
      error={error}
      inputWrapperOrder={['label', 'input', 'description', 'error']}
      wrapperProps={{ 'data-floating': floating || undefined, 'data-select': isSelect || undefined }}
      value={value}
      {...(isSelect ? { rightSection: <Chevron />, rightSectionPointerEvents: 'none' } : {})}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...rest}
    />
  );
}
