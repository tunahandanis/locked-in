chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_PAGE_CONTENT") {
    extractAndSummarizeContent().then((summary) => {
      chrome.runtime.sendMessage({ action: "PAGE_CONTENT", content: summary })
    })
  }
})

async function extractAndSummarizeContent(): Promise<string> {
  const visibleText = extractVisibleText()
  const summary = await summarizeContent(visibleText)
  return summary
}

function extractVisibleText(): string {
  let textContent = ""
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (
          node.parentElement &&
          node.parentElement.offsetParent !== null &&
          node.textContent &&
          node.textContent.trim() !== ""
        ) {
          return NodeFilter.FILTER_ACCEPT
        }
        return NodeFilter.FILTER_REJECT
      },
    },
  )
  let node
  while ((node = walker.nextNode())) {
    textContent += " " + (node.textContent?.trim() || "")
  }
  return textContent
}

function summarizeContent(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Assuming the Gemini Nano Summarization API is accessible via chrome.geminiNano.summarize
    /* chrome.geminiNano.summarize(text, (summary: string) => {
      if (summary) {
        resolve(summary)
      } else {
        reject("Summarization failed")
      }
    }) */
    resolve(text)
  })
}
