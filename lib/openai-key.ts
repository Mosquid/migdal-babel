const OPENAI_API_KEY_STORAGE_KEY = 'openai_api_key';

/**
 * Regex pattern for validating OpenAI API key format
 * - Starts with 'sk-'
 * - Contains only letters, numbers, hyphens, and underscores
 * - No spaces allowed
 */
const OPENAI_API_KEY_REGEX = /^sk-[a-zA-Z0-9_-]+$/;

/**
 * Utility functions for managing OpenAI API key in localStorage
 */
export const openaiKeyStorage = {
  /**
   * Get the OpenAI API key from localStorage
   * @returns The API key if it exists, null otherwise
   */
  get(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      return localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to read OpenAI API key from localStorage:', error);
      return null;
    }
  },

  /**
   * Save the OpenAI API key to localStorage
   * @param key The API key to save (will be trimmed and validated)
   * @throws Error if the key format is invalid
   */
  set(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      const trimmedKey = key.trim();

      if (!this.isValidFormat(trimmedKey)) {
        throw new Error(
          'Invalid OpenAI API key format. Key must start with "sk-" and contain only letters, numbers, hyphens, and underscores.',
        );
      }

      localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, trimmedKey);
    } catch (error) {
      console.error('Failed to save OpenAI API key to localStorage:', error);
      throw error; // Re-throw so the caller can handle it
    }
  },

  /**
   * Remove the OpenAI API key from localStorage
   */
  remove(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
    } catch (error) {
      console.error(
        'Failed to remove OpenAI API key from localStorage:',
        error,
      );
    }
  },

  /**
   * Check if an OpenAI API key exists in localStorage
   * @returns true if a key exists, false otherwise
   */
  exists(): boolean {
    const key = this.get();
    return key !== null && key.length > 0;
  },

  /**
   * Validate if a string matches the OpenAI API key format
   * @param key The key to validate
   * @returns true if the key format is valid, false otherwise
   */
  isValidFormat(key: string): boolean {
    return OPENAI_API_KEY_REGEX.test(key.trim());
  },
};
