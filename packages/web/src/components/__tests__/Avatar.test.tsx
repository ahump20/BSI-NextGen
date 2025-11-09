import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar Component', () => {
  it('renders initials when no src provided', () => {
    render(<Avatar name="John Doe" />);

    const avatar = screen.getByText('J');
    expect(avatar).toBeInTheDocument();
  });

  it('renders initials with correct size classes', () => {
    const { rerender } = render(<Avatar name="Jane Smith" size="sm" />);
    let container = screen.getByText('J');
    expect(container).toHaveClass('w-6', 'h-6', 'text-sm');

    rerender(<Avatar name="Jane Smith" size="md" />);
    container = screen.getByText('J');
    expect(container).toHaveClass('w-10', 'h-10', 'text-base');

    rerender(<Avatar name="Jane Smith" size="lg" />);
    container = screen.getByText('J');
    expect(container).toHaveClass('w-16', 'h-16', 'text-xl');
  });

  it('handles empty name gracefully', () => {
    render(<Avatar name="" />);

    const avatar = screen.getByText('?');
    expect(avatar).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" name="John Doe" />);

    const image = screen.getByAltText('John Doe');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src');
  });

  it('applies custom className', () => {
    render(<Avatar name="Test User" className="custom-class" />);

    const avatar = screen.getByText('T');
    expect(avatar).toHaveClass('custom-class');
  });

  it('uppercases first letter of name', () => {
    render(<Avatar name="alice" />);

    const avatar = screen.getByText('A');
    expect(avatar).toBeInTheDocument();
  });
});
