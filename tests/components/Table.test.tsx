import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Table from '../../src/components/primitives/Table';

interface TestData {
  name: string;
  age: number;
  city: string;
}

const mockData: TestData[] = [
  { name: 'John Doe', age: 30, city: 'New York' },
  { name: 'Jane Smith', age: 25, city: 'Los Angeles' },
  { name: 'Bob Johnson', age: 35, city: 'Chicago' },
];

const mockColumns = [
  { key: 'name' as const, header: 'Name', sortable: true },
  { key: 'age' as const, header: 'Age', sortable: true, align: 'center' as const },
  { key: 'city' as const, header: 'City', sortable: false },
];

describe('Table Component', () => {
  it('renders table with data', () => {
    render(<Table data={mockData} columns={mockColumns} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
  });

  it('renders column headers correctly', () => {
    render(<Table data={mockData} columns={mockColumns} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();
  });

  it('sorts data when clicking sortable column header', () => {
    render(<Table data={mockData} columns={mockColumns} />);

    const nameHeader = screen.getByText('Name');
    const rows = screen.getAllByRole('row');

    // Initial order (should be original data order)
    expect(rows[1]).toHaveTextContent('John Doe');

    // Click to sort ascending
    fireEvent.click(nameHeader);
    const sortedRows = screen.getAllByRole('row');
    expect(sortedRows[1]).toHaveTextContent('Bob Johnson');

    // Click again to sort descending
    fireEvent.click(nameHeader);
    const reverseSortedRows = screen.getAllByRole('row');
    expect(reverseSortedRows[1]).toHaveTextContent('John Doe');
  });

  it('displays loading state', () => {
    render(<Table data={[]} columns={mockColumns} loading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays empty message when no data', () => {
    render(<Table data={[]} columns={mockColumns} emptyMessage="No results found" />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('applies custom render function', () => {
    const customColumns = [
      {
        key: 'name' as const,
        header: 'Name',
        render: (value: string) => <strong data-testid="custom-name">{value.toUpperCase()}</strong>,
      },
    ];

    render(<Table data={mockData} columns={customColumns} />);

    expect(screen.getByTestId('custom-name')).toHaveTextContent('JOHN DOE');
  });

  it('applies striped styling when prop is true', () => {
    const { container } = render(<Table data={mockData} columns={mockColumns} striped />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows[1]).toHaveClass('bg-gray-50');
  });

  it('applies hoverable styling when prop is true', () => {
    const { container } = render(<Table data={mockData} columns={mockColumns} hoverable />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0]).toHaveClass('hover:bg-blue-50');
  });

  it('sorts numeric columns correctly', () => {
    render(<Table data={mockData} columns={mockColumns} />);

    const ageHeader = screen.getByText('Age');

    fireEvent.click(ageHeader);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('25');
    expect(rows[2]).toHaveTextContent('30');
    expect(rows[3]).toHaveTextContent('35');
  });
});
