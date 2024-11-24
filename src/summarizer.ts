class Summarizer {
  private summarizer: AISummarizer | null = null
  private waiting: boolean = false

  constructor(private options: AISummarizerCreateOptions) {
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

      if (capabilities.available === "after-download") {
        console.log(
          "Summarizer is downloading the model. Progress is being logged.",
        )
      } else {
        console.log("Summarizer initialized and ready.")
      }
    } catch (error) {
      console.error("Error initializing Summarizer:", error)
    }
  }

  async summarize(
    text: string,
    additionalContext?: string,
  ): Promise<string | null> {
    if (this.waiting || !this.summarizer) {
      console.warn("Summarizer is busy or not initialized.")
      return null
    }

    this.waiting = true
    try {
      const options: AISummarizerSummarizeOptions = {}
      if (additionalContext) {
        options.context = additionalContext
      }
      const summary = await this.summarizer.summarize(text, options)
      return summary
    } catch (error) {
      console.error("Error during summarization:", error)
      return null
    } finally {
      this.waiting = false
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
