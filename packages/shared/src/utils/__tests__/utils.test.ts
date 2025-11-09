import {
  calculateWinPercentage,
  calculateGamesBack,
  validateApiKey,
  sleep,
  retryWithBackoff,
} from '../index';

describe('Utility Functions', () => {
  describe('calculateWinPercentage', () => {
    it('calculates win percentage correctly', () => {
      expect(calculateWinPercentage(10, 5)).toBe(0.667);
      expect(calculateWinPercentage(5, 10)).toBe(0.333);
      expect(calculateWinPercentage(15, 15)).toBe(0.5);
    });

    it('handles zero games', () => {
      expect(calculateWinPercentage(0, 0)).toBe(0);
    });

    it('handles perfect record', () => {
      expect(calculateWinPercentage(10, 0)).toBe(1);
    });

    it('handles winless record', () => {
      expect(calculateWinPercentage(0, 10)).toBe(0);
    });
  });

  describe('calculateGamesBack', () => {
    it('calculates games back correctly', () => {
      expect(calculateGamesBack(10, 5, 15, 5)).toBe(2.5);
      expect(calculateGamesBack(10, 10, 15, 5)).toBe(5);
    });

    it('handles teams tied for first', () => {
      expect(calculateGamesBack(15, 5, 15, 5)).toBe(0);
    });

    it('handles negative games back (ahead of leader)', () => {
      expect(calculateGamesBack(20, 5, 15, 10)).toBe(-2.5);
    });
  });

  describe('validateApiKey', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalPhase = process.env.NEXT_PHASE;

    beforeEach(() => {
      delete process.env.NODE_ENV;
      delete process.env.NEXT_PHASE;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      process.env.NEXT_PHASE = originalPhase;
    });

    it('returns key when provided', () => {
      const key = 'test-api-key-12345';
      expect(validateApiKey(key, 'TestProvider')).toBe(key);
    });

    it('returns placeholder in development mode', () => {
      process.env.NODE_ENV = 'development';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = validateApiKey(undefined, 'TestProvider');

      expect(result).toBe('placeholder-api-key-for-build');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing API key for TestProvider')
      );

      consoleWarnSpy.mockRestore();
    });

    it('returns placeholder during build phase', () => {
      process.env.NEXT_PHASE = 'phase-production-build';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = validateApiKey(undefined, 'TestProvider');

      expect(result).toBe('placeholder-api-key-for-build');

      consoleWarnSpy.mockRestore();
    });

    it('throws error in production when key is missing', () => {
      process.env.NODE_ENV = 'production';

      expect(() => validateApiKey(undefined, 'TestProvider')).toThrow(
        'Missing API key for TestProvider'
      );
    });
  });

  describe('sleep', () => {
    jest.useFakeTimers();

    it('resolves after specified delay', async () => {
      const promise = sleep(1000);

      jest.advanceTimersByTime(999);
      expect(promise).toBeInstanceOf(Promise);

      jest.advanceTimersByTime(1);
      await promise;

      expect(true).toBe(true); // If we get here, sleep resolved
    });

    afterAll(() => {
      jest.useRealTimers();
    });
  });

  describe('retryWithBackoff', () => {
    jest.useFakeTimers();

    it('returns result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, 3, 100);

      // Fast-forward through retry delays
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('throws last error after max retries', async () => {
      const error = new Error('persistent failure');
      const fn = jest.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn, 3, 100);

      // Fast-forward through retry delays
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('persistent failure');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('uses exponential backoff delays', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const sleepSpy = jest.spyOn(global, 'setTimeout');

      const promise = retryWithBackoff(fn, 3, 1000);

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow();

      // Check that delays doubled each time: 1000ms, 2000ms
      const delays = sleepSpy.mock.calls
        .filter(call => call[1] === 1000 || call[1] === 2000)
        .map(call => call[1]);

      expect(delays).toContain(1000);
      expect(delays).toContain(2000);

      sleepSpy.mockRestore();
    });

    afterAll(() => {
      jest.useRealTimers();
    });
  });
});
