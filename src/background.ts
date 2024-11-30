// background.ts
import { SIMILARITY_THRESHOLDS, TRACKING_MODES } from "./constants"
import { SessionDataType } from "./types"

let isBackgroundScriptTracking = false
let goalText = ""
let trackingMode = TRACKING_MODES.BROAD

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "INITIATE_TRACKING") {
    goalText = message.goal
    trackingMode = message.mode || TRACKING_MODES.BROAD
    isBackgroundScriptTracking = true
    startTracking()
  } else if (message.action === "TERMINATE_TRACKING") {
    isBackgroundScriptTracking = false
    stopTracking()
  } else if (message.action === "ANALYSIS_RESULT") {
    const { similarity } = message.payload
    const threshold = SIMILARITY_THRESHOLDS[trackingMode]
    if (similarity !== null && similarity < threshold) {
      // Increment distraction count
      updateCurrentSession((session) => {
        session.distractions += 1
      })

      chrome.notifications.create("", {
        type: "basic",
        iconUrl: "icons/icon32.png",
        title: "⚠️ Stay Focused!",
        message: "The content you are viewing may not align with your goal.",
        priority: 2,
        buttons: [{ title: "Get Back on Track" }],
      })
    }
  }
})

chrome.notifications.onButtonClicked.addListener(
  (notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.update(tabs[0].id, { url: "chrome://newtab" })
        }
      })
    }
    chrome.notifications.clear(notificationId)
  },
)

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "trackingTimer") {
    chrome.storage.session.set({ isTracking: false, endTime: null, goal: "" })

    // Stop tracking logic
    isBackgroundScriptTracking = false
    stopTracking()

    chrome.notifications.create("", {
      type: "basic",
      iconUrl: "icons/icon32.png",
      title: "⏰ Time's Up!",
      message: "Great job! Your tracking session has ended.",
      priority: 2,
    })
  }
})

async function startTracking() {
  await createOffscreenDocument()
  chrome.runtime.sendMessage({
    action: "SET_GOAL",
    goal: goalText,
    mode: trackingMode,
  })
  injectContentScriptIntoActiveTab()
  chrome.tabs.onUpdated.addListener(handleTabUpdated)

  // Initialize current session and store it in chrome.storage.session
  const session: SessionDataType = {
    startTime: Date.now(),
    endTime: 0, // will set when session ends
    distractions: 0,
  }
  chrome.storage.session.set({ currentSession: session })
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
  chrome.tabs.onUpdated.removeListener(handleTabUpdated)

  // Finalize current session
  chrome.storage.session.get("currentSession", (result) => {
    const session: SessionDataType = result.currentSession
    if (session) {
      session.endTime = Date.now()
      saveSessionData(session)
      // Remove currentSession from storage
      chrome.storage.session.remove("currentSession")
    }
  })
}

function handleTabUpdated(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab,
) {
  if (
    isBackgroundScriptTracking &&
    changeInfo.status === "complete" &&
    isValidUrl(tab.url)
  ) {
    injectContentScript(tabId)
  }
}

function injectContentScript(tabId: number) {
  chrome.tabs.sendMessage(tabId, { action: "PING" }, (response) => {
    if (chrome.runtime.lastError) {
      handleContentScriptInjection(tabId)
    } else if (response.status === "alive" && !response.isRunning) {
      chrome.tabs.sendMessage(tabId, { action: "START_TAB_TRACKING" })
    }
  })
}

function handleContentScriptInjection(tabId: number) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error(
        `Error getting tab ${tabId}: ${chrome.runtime.lastError.message}`,
      )
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
            console.error(
              `Error injecting content script into tab ${tabId}: ${chrome.runtime.lastError.message}`,
            )
          } else {
            chrome.tabs.sendMessage(tabId, { action: "START_TAB_TRACKING" })
            console.log(
              `Content script injected and tracking started on tab ${tabId}`,
            )
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
    console.log("Offscreen document created.")
  }
}

async function closeOffscreenDocument() {
  const exists = await chrome.offscreen.hasDocument()
  if (exists) {
    await chrome.offscreen.closeDocument()
    console.log("Offscreen document closed.")
  }
}

function saveSessionData(session: SessionDataType) {
  const sessionDurationMs = session.endTime - session.startTime

  chrome.storage.local.get(["sessions"], (result) => {
    const sessions: SessionDataType[] = result.sessions || []
    sessions.push({
      startTime: session.startTime,
      endTime: session.endTime,
      distractions: session.distractions,
      durationMs: sessionDurationMs,
    })
    chrome.storage.local.set({ sessions: sessions }, () => {
      console.log("Session data saved.")
    })
  })
}

function updateCurrentSession(updater: (session: SessionDataType) => void) {
  chrome.storage.session.get("currentSession", (result) => {
    const session: SessionDataType = result.currentSession
    if (session) {
      updater(session)
      chrome.storage.session.set({ currentSession: session })
    }
  })
}
