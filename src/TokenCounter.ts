const AVERAGE_CHARS_PER_TOKEN = 4

export default class TokenCounter {
  private languageModel?: AILanguageModel

  private constructor(languageModel?: AILanguageModel) {
    this.languageModel = languageModel
  }

  async countTokens(input: string): Promise<number> {
    if (this.languageModel) {
      return await this.languageModel.countPromptTokens(input)
    } else {
      return Math.ceil(input.length / AVERAGE_CHARS_PER_TOKEN)
    }
  }

  static async create(): Promise<TokenCounter> {
    if (self.ai && self.ai.languageModel) {
      const capabilities = await self.ai.languageModel.capabilities()
      if (capabilities.available !== "no") {
        const languageModel = await self.ai.languageModel.create()
        return new TokenCounter(languageModel)
      }
    }
    return new TokenCounter()
  }
}
