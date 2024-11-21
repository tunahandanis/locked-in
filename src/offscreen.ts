import * as tf from "@tensorflow/tfjs"
import * as use from "@tensorflow-models/universal-sentence-encoder"

let useModel: use.UniversalSentenceEncoder | null = null
let goalText = ""

async function initialize() {
  try {
    await tf.setBackend("cpu")
    await tf.ready()
    useModel = await use.load()
    console.log("Model loaded in offscreen document")
  } catch (error) {
    console.error("Error during initialization:", error)
  }
}

initialize()

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "SET_GOAL") {
    goalText = message.goal
  } else if (message.action === "PAGE_CONTENT") {
    const content = message.content
    analyzeContent(content)
  } else if (message.action === "RESET_GOAL") {
    goalText = ""
  }
})

async function analyzeContent(content: string) {
  if (useModel && goalText) {
    const result = await analyzeContentInternal(goalText, content)
    console.log(content, result)
    chrome.runtime.sendMessage({ action: "ANALYSIS_RESULT", payload: result })
  }
}

async function analyzeContentInternal(goal: string, content: string) {
  // Compute embeddings
  try {
    const embeddings = await useModel!.embed([goal, content])
    const embeddingsArray = await embeddings.array()
    const [goalEmbeddingArray, contentEmbeddingArray] = embeddingsArray
    // Compute cosine similarity
    const similarity = computeCosineSimilarity(
      goalEmbeddingArray,
      contentEmbeddingArray,
    )
    return { similarity }
  } catch (error) {
    console.error("Error during analysis", error)
  }
}

function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
