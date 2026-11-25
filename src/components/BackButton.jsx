import { UnstyledButton } from '@mantine/core';
import { BackIcon } from './Icons';

export function BackButton({ onClick }) {
  return (
    <UnstyledButton className="sd-back" onClick={onClick}>
      <BackIcon />
      Back
    </UnstyledButton>
  );
}
