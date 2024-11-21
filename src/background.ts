let isBackgroundScriptTracking = false
let goalText = ""

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "INITIATE_TRACKING") {
    goalText = message.goal
    isBackgroundScriptTracking = true
    startTracking()
  } else if (message.action === "TERMINATE_TRACKING") {
    isBackgroundScriptTracking = false
    stopTracking()
  } else if (message.action === "ANALYSIS_RESULT") {
    const { similarity } = message.payload
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
})

async function startTracking() {
  await createOffscreenDocument()
  chrome.runtime.sendMessage({ action: "SET_GOAL", goal: goalText })
  injectContentScriptIntoActiveTab()
  chrome.tabs.onActivated.addListener(handleTabActivated)
}

function stopTracking() {
  chrome.runtime.sendMessage({ action: "RESET_GOAL" })
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id && isValidUrl(tab.url)) {
        chrome.tabs.sendMessage(tab.id, { action: "PAUSE_TAB_TRACKING" })
      }
    })
  })
  closeOffscreenDocument()
  chrome.tabs.onActivated.removeListener(handleTabActivated)
}

function handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo) {
  if (isBackgroundScriptTracking) {
    injectContentScript(activeInfo.tabId)
  }
}

function injectContentScript(tabId: number) {
  chrome.tabs.sendMessage(tabId, { action: "PING" }, (response) => {
    // No existing content script, proceed to inject it
    if (chrome.runtime.lastError) {
      handleContentScriptInjection(tabId)
    }
  })
}

function handleContentScriptInjection(tabId: number) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message)
      return
    }
    if (tab && isValidUrl(tab.url)) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ["content.js"],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message)
          } else {
            chrome.tabs.sendMessage(tabId, { action: "START_TAB_TRACKING" })
          }
        },
      )
    } else {
      console.warn(
        `Cannot inject content script into tab ${tabId} with URL ${tab?.url}`,
      )
    }
  })
}

function isValidUrl(url: string | undefined): boolean {
  if (!url) return false
  const validProtocols = ["http:", "https:"]
  return validProtocols.some((protocol) => url.startsWith(protocol))
}

function injectContentScriptIntoActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      injectContentScript(tabs[0].id)
    }
  })
}

async function createOffscreenDocument() {
  const offscreenUrl = "offscreen.html"
  const exists = await chrome.offscreen.hasDocument()
  if (!exists) {
    await chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: "Need to perform background computations on page content.",
    })
  }
}

async function closeOffscreenDocument() {
  const exists = await chrome.offscreen.hasDocument()
  if (exists) {
    await chrome.offscreen.closeDocument()
  }
}