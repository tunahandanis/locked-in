;(function () {
  let isContentScriptTracking = false
  let scanIntervalId: number | undefined
  let scanTimeoutId: number | undefined

  // Listen for messages to start or stop tracking
  chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "PING") {
      sendResponse({ status: "alive" })
      return
    }

    if (message.action === "PAUSE_TAB_TRACKING") {
      isContentScriptTracking = false
      clearScheduledScans()
    } else if (message.action === "START_TAB_TRACKING") {
      isContentScriptTracking = true
      scheduleScans()
    }
  })

  // Handle visibility changes
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && isContentScriptTracking) {
      scheduleScans()
    } else {
      clearScheduledScans()
    }
  })

  function scheduleScans() {
    console.log(scanIntervalId, scanTimeoutId)
    if (scanIntervalId || scanTimeoutId) {
      console.error("Scanning already scheduled.")
      return
    }
    scanTimeoutId = window.setTimeout(() => {
      sendPageContent()
      scanTimeoutId = undefined
      scanIntervalId = window.setInterval(() => {
        sendPageContent()
      }, 10000)
    }, 10000)
  }

  function clearScheduledScans() {
    if (scanTimeoutId) {
      window.clearTimeout(scanTimeoutId)
      scanTimeoutId = undefined
    }
    if (scanIntervalId) {
      window.clearInterval(scanIntervalId)
      scanIntervalId = undefined
    }
  }

  function sendPageContent() {
    const pageContent = extractVisibleText()
    chrome.runtime.sendMessage({ action: "PAGE_CONTENT", content: pageContent })
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
            isElementInViewport(node.parentElement) &&
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

  function isElementInViewport(el: Element): boolean {
    const rect = el.getBoundingClientRect()
    return (
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }
})()
