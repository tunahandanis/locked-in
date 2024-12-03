;(function () {
  let isContentScriptTracking = false
  let scanIntervalId: number | undefined
  let scanTimeoutId: number | undefined

  let visibilityChangeHandler: (() => void) | null = null

  chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "PING") {
      sendResponse({ status: "alive", isRunning: isContentScriptTracking })
      return
    }

    if (message.action === "PAUSE_TAB_TRACKING") {
      isContentScriptTracking = false
      clearScheduledScans()

      if (visibilityChangeHandler) {
        document.removeEventListener(
          "visibilitychange",
          visibilityChangeHandler,
        )
        visibilityChangeHandler = null
      }
    } else if (message.action === "START_TAB_TRACKING") {
      isContentScriptTracking = true
      scheduleScans()

      if (!visibilityChangeHandler) {
        visibilityChangeHandler = () => {
          if (
            document.visibilityState === "visible" &&
            isContentScriptTracking
          ) {
            scheduleScans()
          } else {
            clearScheduledScans()
          }
        }
        document.addEventListener("visibilitychange", visibilityChangeHandler)
      }
    }
  })

  function scheduleScans() {
    if (scanIntervalId || scanTimeoutId) {
      console.error("Scanning already scheduled.")
      return
    }
    scanTimeoutId = window.setTimeout(() => {
      sendPageContent()
      scanTimeoutId = undefined
      scanIntervalId = window.setInterval(() => {
        sendPageContent()
      }, 15000)
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
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim()
            if (text && isTextNodeInViewport(node as Text)) {
              return NodeFilter.FILTER_ACCEPT
            } else {
              return NodeFilter.FILTER_REJECT
            }
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            if (isElementVisible(element)) {
              return NodeFilter.FILTER_ACCEPT
            } else {
              return NodeFilter.FILTER_REJECT
            }
          }

          return NodeFilter.FILTER_SKIP
        },
      },
    )

    let node
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        textContent += " " + (node.textContent?.trim() ?? "")
      }
    }

    return textContent
  }

  function isElementVisible(element: Element): boolean {
    const style = window.getComputedStyle(element)
    if (
      style.display === "none" ||
      style.visibility !== "visible" ||
      style.opacity === "0"
    ) {
      return false
    }

    const rect = element.getBoundingClientRect()
    return (
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  function isTextNodeInViewport(textNode: Text): boolean {
    const range = document.createRange()
    range.selectNodeContents(textNode)
    const rects = range.getClientRects()

    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i]
      if (
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth)
      ) {
        return true
      }
    }
    return false
  }
})()
