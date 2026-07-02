const MIN_TYPING_DELAY_PER_CHAR_MS = 15;
const MAX_TYPING_DELAY_PER_CHAR_MS = 45;

export function getRandomComposingDelayMs(chars: number): number {
  const safeChars = Math.max(1, Math.floor(chars));
  const minTotalDelay = safeChars * MIN_TYPING_DELAY_PER_CHAR_MS;
  const maxTotalDelay = safeChars * MAX_TYPING_DELAY_PER_CHAR_MS;

  return (
    Math.floor(Math.random() * (maxTotalDelay - minTotalDelay + 1)) +
    minTotalDelay
  );
}

export async function waitRandomComposingDelay(chars: number): Promise<number> {
  const delayMs = getRandomComposingDelayMs(chars);

  await new Promise((resolve) => setTimeout(resolve, delayMs));

  return delayMs;
}
