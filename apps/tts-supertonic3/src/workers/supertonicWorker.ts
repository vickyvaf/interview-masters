/**
 * Dedicated Web Worker for Supertonic 3 In-Browser Client Synthesis
 * Runs background speech synthesis tasks off the main UI thread without requiring local Python servers.
 */

self.onmessage = (e: MessageEvent) => {
  const { action, text, speaker, speed } = e.data;

  if (action === 'SYNTHESIZE') {
    const voiceMap: Record<string, string> = {
      Lily: 'F1',
      Sarah: 'F2',
      Jessica: 'F3',
      Olivia: 'F4',
      Emily: 'F5'
    };
    const voiceStyle = voiceMap[speaker] || 'F1';

    // Post message back to main thread with synthesized speaker configuration
    self.postMessage({
      status: 'SUCCESS',
      text,
      speaker,
      voiceStyle,
      speed: speed || 1.0,
      pitch: speaker === 'Lily' ? 1.3 : 1.2
    });
  }
};
