import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Boton';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    // Use vitest's built-in matchers (no jest-dom needed for basic checks)
    const el = screen.getByText('Click me');
    expect(el).toBeTruthy();
  });
});
