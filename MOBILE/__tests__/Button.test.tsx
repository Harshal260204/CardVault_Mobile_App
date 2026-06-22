import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../components/Button';



describe('Button component', () => {
  it('renders correctly with default props', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button label="Submit" onPress={onPressMock} />);
    expect(getByText('Submit')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(<Button label="Submit" onPress={onPressMock} />);
    fireEvent.press(getByRole('button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when isDisabled is true', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(<Button label="Submit" onPress={onPressMock} isDisabled />);
    fireEvent.press(getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('does not call onPress when isLoading is true', () => {
    const onPressMock = jest.fn();
    const { getByRole, queryByText } = render(<Button label="Submit" onPress={onPressMock} isLoading />);
    fireEvent.press(getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();
    // Label should be hidden while loading
    expect(queryByText('Submit')).toBeNull();
  });
});
