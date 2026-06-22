/**
 * TODO: Integrate expo-speech-recognition or a platform speech-to-text provider.
 * This stub simulates transcription for the voice-to-text button on the Notes step.
 */
export async function transcribeVoiceStub(): Promise<string> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 450);
  });
  return 'Follow up next week.';
}
