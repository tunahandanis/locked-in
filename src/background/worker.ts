// import * as tf from "@tensorflow/tfjs"
import * as use from "@tensorflow-models/universal-sentence-encoder"

let useModel: use.UniversalSentenceEncoder | null = null

self.addEventListener("message", async (event) => {
  const { action, payload } = event.data
  if (action === "LOAD_MODEL") {
    useModel = await use.load()
    self.postMessage({ action: "MODEL_LOADED" })
  } else if (action === "ANALYZE_CONTENT") {
    const { goalText, content } = payload
    const result = await analyzeContent(goalText, content)
    self.postMessage({ action: "ANALYSIS_RESULT", payload: result })
  }
})

async function analyzeContent(goalText: string, content: string) {
  if (useModel) {
    // Compute embeddings
    const embeddings = await useModel.embed([goalText, content])
    const embeddingsArray = await embeddings.array()
    const [goalEmbeddingArray, contentEmbeddingArray] = embeddingsArray
    // Compute cosine similarity
    const similarity = computeCosineSimilarity(
      goalEmbeddingArray,
      contentEmbeddingArray,
    )
    return { similarity }
  }
  return { similarity: null }
}

function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
