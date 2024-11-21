let tracking = false
let goalText = ""
let worker: Worker | null = null

// Load the Web Worker
function initializeWorker() {
  worker = new Worker("worker.js")

  worker.onmessage = (event) => {
    const { action, payload } = event.data
    if (action === "MODEL_LOADED") {
      console.log("Model loaded in worker")
    } else if (action === "ANALYSIS_RESULT") {
      const { similarity } = payload
      if (similarity !== null && similarity < 0.5) {
        chrome.notifications.create("", {
          type: "basic",
          iconUrl: "icons/icon32.png",
          title: "Stay Focused!",
          message: "The content you are viewing may not align with your goal.",
          priority: 2,
        })
      }
    }
  }

  // Load the model in the worker
  worker.postMessage({ action: "LOAD_MODEL" })
}

initializeWorker()

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "START_TRACKING") {
    goalText = message.goal
    tracking = true
    startTracking()
  } else if (message.action === "STOP_TRACKING") {
    tracking = false
    stopTracking()
  } else if (message.action === "PAGE_CONTENT") {
    analyzeContent(message.content)
  }
})

function startTracking() {
  scheduleScans()
}

function stopTracking() {
  clearScheduledScans()
}

let initialTimeoutId: number | undefined
let intervalId: number | undefined

function scheduleScans() {
  // Initial scan after 10 seconds
  initialTimeoutId = window.setTimeout(() => {
    scanActiveTab()
    // Subsequent scans every 30 seconds
    intervalId = window.setInterval(scanActiveTab, 30000)
  }, 10000)
}

function clearScheduledScans() {
  if (initialTimeoutId) {
    clearTimeout(initialTimeoutId)
    initialTimeoutId = undefined
  }
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = undefined
  }
}

function scanActiveTab() {
  if (tracking) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "GET_PAGE_CONTENT" })
      }
    })
  }
}

function analyzeContent(content: string) {
  if (worker && goalText) {
    worker.postMessage({
      action: "ANALYZE_CONTENT",
      payload: { goalText, content },
    })
  }
}
