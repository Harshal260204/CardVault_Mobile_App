import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from '../components/Text';
import { typography } from '../tokens/typography';

jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    text: '#123456',
  }),
}));

describe('Text component typography variants', () => {
  const variants = Object.keys(typography) as (keyof typeof typography)[];

  it.each(variants)('renders %s variant correctly', (variant) => {
    const { toJSON } = render(<Text variant={variant}>{variant} text</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('supports numberOfLines prop', () => {
    const { toJSON } = render(<Text numberOfLines={2}>Truncated text</Text>);
    const json = toJSON() as any;
    expect(json.props.numberOfLines).toBe(2);
  });

  it('auto-applies accessibilityRole="header" for heading variants', () => {
    const { getByRole } = render(<Text variant="h1">Heading</Text>);
    expect(getByRole('header')).toBeTruthy();
  });
});
