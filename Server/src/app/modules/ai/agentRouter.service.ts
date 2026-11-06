export class OpenRouterService {
  private static dynamicKeys: string[] = [];
  private static currentKeyIndex = 0;

  /**
   * Set dynamic keys from DB
   */
  public static setDynamicKeys(keys: string[]) {
    this.dynamicKeys = (keys || []).map((k) => k.trim()).filter(Boolean);
  }

  /**
   * Get merged keys from process.env and DB
   */
  private static getMergedKeys(): string[] {
    const envKeys = process.env.OPENROUTER_API_KEYS || process.env.AGENTROUTER_API_KEYS
      ? (process.env.OPENROUTER_API_KEYS || process.env.AGENTROUTER_API_KEYS)!.split(',').map((k) => k.trim()).filter(Boolean)
      : [];
    const singleEnv = (process.env.OPENROUTER_API_KEY || process.env.AGENTROUTER_API_KEY)?.trim();

    return Array.from(
      new Set([
        ...this.dynamicKeys,
        ...envKeys,
        ...(singleEnv ? [singleEnv] : []),
      ])
    ).filter(Boolean);
  }

  public static getPoolSize(): number {
    return this.getMergedKeys().length;
  }

  /**
   * Test a single OpenRouter key live
   */
  public static async testKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: 'API key cannot be empty' };
    }

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
          'X-Title': 'Food Flow Food Delivery',
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10,
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as any;
        const errMsg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        return { success: false, message: errMsg };
      }

      return { success: true, message: 'OpenRouter API key verified successfully!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Connection failed' };
    }
  }

  /**
   * Generate content using OpenRouter with key failover
   */
  public static async generateContent(options: {
    messages: Array<{ role: string; content: string }>;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const keys = this.getMergedKeys();
    if (keys.length === 0) {
      throw new Error('No OpenRouter API keys available in environment or database.');
    }

    const totalKeys = keys.length;
    let attempts = 0;
    let lastError: any = null;

    const chatPayloadMessages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      chatPayloadMessages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    options.messages.forEach((m) => {
      chatPayloadMessages.push({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || '',
      });
    });

    const targetModel = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

    while (attempts < totalKeys) {
      const activeKey = keys[this.currentKeyIndex % totalKeys];

      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeKey}`,
            'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
            'X-Title': 'Food Flow Food Delivery',
          },
          body: JSON.stringify({
            model: targetModel,
            messages: chatPayloadMessages,
            temperature: options.temperature ?? 0.6,
            max_tokens: options.maxTokens ?? 1000,
          }),
          signal: AbortSignal.timeout(20000),
        });

        const resJson = (await res.json().catch(() => null)) as any;

        if (res.ok) {
          const text = resJson?.choices?.[0]?.message?.content || resJson?.choices?.[0]?.text;
          if (text && typeof text === 'string' && text.trim().length > 0) {
            return text.trim();
          }
        }

        lastError = resJson?.error?.message || `OpenRouter HTTP ${res.status}: ${res.statusText}`;

        this.currentKeyIndex = (this.currentKeyIndex + 1) % totalKeys;
        attempts++;
      } catch (err: any) {
        lastError = err?.message || err;
        this.currentKeyIndex = (this.currentKeyIndex + 1) % totalKeys;
        attempts++;
      }
    }

    throw new Error(`All OpenRouter API keys failed. Last error: ${lastError}`);
  }
}

// Backward-compatible alias
export const AgentRouterService = OpenRouterService;
