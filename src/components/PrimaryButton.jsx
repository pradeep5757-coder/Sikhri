import { Button } from '@mantine/core';

/** Full-width gold pill button used for every step's main action. */
export function PrimaryButton({ children, type = 'submit', ...rest }) {
  return (
    <Button type={type} fullWidth classNames={{ root: 'sd-btn', label: 'sd-btn-label' }} {...rest}>
      {children}
    </Button>
  );
}
