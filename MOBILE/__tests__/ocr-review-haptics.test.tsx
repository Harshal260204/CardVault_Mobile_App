import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import React from 'react';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { SaveSummary } from '@/screens/ocr-review/SaveSummary';
import { initialOcrReviewState } from '@/screens/ocr-review/state';
import { haptics, setReduceHapticsPreference } from '@/utils/haptics';

interface OcrReviewInteractionHarnessProps {
  onSave: () => Promise<void>;
}

function OcrReviewInteractionHarness({
  onSave,
}: OcrReviewInteractionHarnessProps) {
  return (
    <>
      <Banner
        variant="info"
        title="Possible duplicate"
        message="Similar contact found: Jane Doe"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              label="Merge"
              onPress={() => {
                void haptics.selection();
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              label="Keep Both"
              onPress={() => {
                void haptics.selection();
              }}
            />
          </>
        }
      />
      <SaveSummary
        state={{ ...initialOcrReviewState, fullName: 'Jane Doe' }}
        onSave={onSave}
        onSaveAndScanNext={() => undefined}
        isSaving={false}
      />
    </>
  );
}

describe('OCR review haptics integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setReduceHapticsPreference(false);
  });

  it('fires haptics across duplicate resolution and save interactions', async () => {
    const { getByLabelText } = render(
      <OcrReviewInteractionHarness
        onSave={async () => {
          await haptics.success();
        }}
      />,
    );

    fireEvent(getByLabelText('Merge'), 'pressIn');
    fireEvent.press(getByLabelText('Merge'));
    fireEvent(getByLabelText('Keep Both'), 'pressIn');
    fireEvent.press(getByLabelText('Keep Both'));
    fireEvent(getByLabelText('Save contact'), 'pressIn');
    fireEvent.press(getByLabelText('Save contact'));

    await waitFor(() => {
      expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success,
      );
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });
  });

  it('does not call expo-haptics when Reduce Haptics is enabled', async () => {
    setReduceHapticsPreference(true);

    const { getByLabelText } = render(
      <OcrReviewInteractionHarness
        onSave={async () => {
          await haptics.success();
        }}
      />,
    );

    fireEvent(getByLabelText('Merge'), 'pressIn');
    fireEvent.press(getByLabelText('Merge'));
    fireEvent(getByLabelText('Keep Both'), 'pressIn');
    fireEvent.press(getByLabelText('Keep Both'));
    fireEvent(getByLabelText('Save contact'), 'pressIn');
    fireEvent.press(getByLabelText('Save contact'));

    await waitFor(() => {
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });
});
