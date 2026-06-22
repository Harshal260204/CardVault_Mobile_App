import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { TextInput } from '../components/TextInput';

jest.mock('@/theme/useThemeColors', () => ({
  useThemeColors: () => ({
    isDark: false,
    text: '#10131A',
    muted: '#5B6270',
    placeholder: '#9AA1AE',
    tokens: {
      neutral: {
        0: '#FFFFFF',
        50: '#F7F8FA',
        100: '#EEF0F4',
        900: '#10131A',
      },
      primary: {
        500: '#2F5BB7',
      },
      error: {
        text: '#B91C1C',
      },
    },
  }),
}));

describe('TextInput component snapshots', () => {
  const baseProps = {
    label: 'Email',
    value: '',
    onChangeText: jest.fn(),
  };

  it('renders default state', () => {
    const { toJSON } = render(<TextInput {...baseProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders focused state', () => {
    const { toJSON, getByLabelText } = render(<TextInput {...baseProps} />);
    fireEvent(getByLabelText('Email'), 'focus');
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders error state', () => {
    const { toJSON } = render(
      <TextInput
        {...baseProps}
        value="bad@"
        error="Enter a valid email address"
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders disabled state', () => {
    const { toJSON } = render(
      <TextInput {...baseProps} value="employee@cardvault.local" isDisabled />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
