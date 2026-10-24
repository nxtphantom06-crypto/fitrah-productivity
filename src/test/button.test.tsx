import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/button';

afterEach(cleanup);

describe('Shared button child handling', () => {
  it('renders and activates a single slotted link without extra children', () => {
    const onClick = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault());
    render(<Button asChild onClick={onClick}><a href="/prayers">Prayers</a></Button>);
    const link = screen.getByRole('link', { name: 'Prayers' });
    expect(link).toHaveAttribute('href', '/prayers');
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('preserves a single slotted child while loading', () => {
    render(<Button asChild loading><a href="/dashboard">Home</a></Button>);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-busy', 'true');
  });

  it('disables an ordinary loading button and preserves its accessible name', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});