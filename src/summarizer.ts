import TokenCounter from "./TokenCounter" // Ensure this is the correct path
import { splitText } from "./utils"

class Summarizer {
  private summarizer: AISummarizer | null = null
  private tokenCounter: TokenCounter | null = null
  private MAX_TOKENS: number = 800 // Adjust based on actual limit
  private options: AISummarizerCreateOptions

  constructor(options: AISummarizerCreateOptions) {
    this.options = options
    this.init()
  }

  private async init() {
    try {
      const capabilities = await window.ai.summarizer.capabilities()
      if (capabilities.available === "no") {
        console.error("Summarizer API is not available.")
        return
      }

      this.summarizer = await window.ai.summarizer.create({
        ...this.options,
        monitor: (monitor) => {
          monitor.addEventListener("downloadprogress", (e: Event) => {
            const progressEvent = e as DownloadProgressEvent
            console.log(
              `Downloaded ${progressEvent.loaded} of ${progressEvent.total} bytes.`,
            )
          })
        },
      })

      this.tokenCounter = await TokenCounter.create()

      console.log("Summarizer initialized and ready.")
    } catch (error) {
      console.error("Error initializing Summarizer:", error)
    }
  }

  private async summarizeText(text: string): Promise<string | null> {
    if (!this.summarizer) {
      console.warn("Summarizer is not initialized.")
      return null
    }

    try {
      const summary = await this.summarizer.summarize(text)
      return summary
    } catch (error) {
      console.error("Error during summarization:", error)
      return null
    }
  }

  async recursiveSummarize(text: string): Promise<string | null> {
    const MAX_CHUNK_SIZE = 3000 // Adjust as needed
    const CHUNK_OVERLAP = 200 // Adjust as needed

    const splits = splitText(text, MAX_CHUNK_SIZE, CHUNK_OVERLAP)

    const summaries: string[] = []
    let currentSummaryBatch: string[] = []

    for (let i = 0; i < splits.length; i++) {
      const chunk = splits[i].trim()
      const summarizedPart = await this.summarizeText(chunk)
      if (!summarizedPart) continue

      currentSummaryBatch.push(summarizedPart)

      const combinedSummary = currentSummaryBatch.join("\n")
      const tokenCount = await this.tokenCounter!.countTokens(combinedSummary)

      if (tokenCount > this.MAX_TOKENS) {
        // Exceeds token limit, push current batch and start new
        currentSummaryBatch.pop() // Remove last to include it in the next batch
        summaries.push(currentSummaryBatch.join("\n"))
        currentSummaryBatch = [summarizedPart]
      }
    }

    // Push any remaining summaries
    if (currentSummaryBatch.length > 0) {
      summaries.push(currentSummaryBatch.join("\n"))
    }

    if (summaries.length === 1) {
      // Base case: only one summary, return it
      return summaries[0]
    } else {
      // Recursive case: summarize the summaries
      const combinedSummaries = summaries.join("\n")
      return this.recursiveSummarize(combinedSummaries)
    }
  }

  destroy() {
    if (this.summarizer) {
      this.summarizer.destroy()
      this.summarizer = null
      console.log("Summarizer instance destroyed.")
    }
  }
}

export default Summarizer
