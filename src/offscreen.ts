import * as tf from "@tensorflow/tfjs"
import * as use from "@tensorflow-models/universal-sentence-encoder"
import Summarizer from "./summarizer"
import DOMPurify from "dompurify"

let summarizer: Summarizer | null = null
let useModel: use.UniversalSentenceEncoder | null = null
let goalText = ""

/**
 * Initializes TensorFlow.js and loads the Universal Sentence Encoder model.
 */
async function initialize() {
  try {
    await tf.setBackend("cpu")
    await tf.ready()
    useModel = await use.load()
    console.log("Universal Sentence Encoder model loaded in offscreen document")
  } catch (error) {
    console.error("Error during TensorFlow.js initialization:", error)
  }
}

initialize()

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "SET_GOAL") {
    goalText = message.goal
    initializeSummarizer()
  } else if (message.action === "PAGE_CONTENT") {
    analyzeContent(message.content)
  } else if (message.action === "RESET_GOAL") {
    goalText = ""
    if (summarizer) {
      summarizer.destroy()
      summarizer = null
    }
  }
})

async function initializeSummarizer() {
  if (!goalText) {
    console.error("Goal text is empty. Cannot initialize Summarizer.")
    return
  }

  if (summarizer) {
    summarizer.destroy()
    summarizer = null
  }

  const options: AISummarizerCreateOptions = {
    sharedContext: `Generate an objective summary of the provided content for similarity analysis using the Universal Sentence Encoder (USE) model. The summary should encompass both predominant and supporting elements present in the content, prioritized by their frequency and prominence. Focus exclusively on factual information without introducing any analysis, commentary, or subjective interpretations. Maintain an objective tone and ensure the summary accurately reflects the content's information.`,
    type: "teaser",
    format: "markdown",
    length: "long",
  }

  summarizer = new Summarizer(options)
}

async function analyzeContent(content: string) {
  console.log("Raw", content)
  if (useModel && goalText && summarizer) {
    try {
      const summarizationResult = await summarizeContent(content)
      console.log("Summary", summarizationResult)
      if (!summarizationResult) return
      const result = await analyzeContentInternal(goalText, summarizationResult)
      console.log("Similarity result", result)

      chrome.runtime.sendMessage({ action: "ANALYSIS_RESULT", payload: result })
    } catch {
      // Handle errors if necessary
      console.error("Error during content analysis.")
    }
  }
}

async function summarizeContent(content: string): Promise<string | null> {
  const sanitizedContent = sanitizeText(content)

  return (await summarizer?.summarize(sanitizedContent)) || null
}

function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
}

async function analyzeContentInternal(
  goal: string,
  summary: string,
): Promise<{ similarity: number } | null> {
  try {
    const embeddings = await useModel!.embed([goal, summary])
    const [goalEmbedding, summaryEmbedding] = await embeddings.array()
    return {
      similarity: computeCosineSimilarity(goalEmbedding, summaryEmbedding),
    }
  } catch {
    return null
  }
}

function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
