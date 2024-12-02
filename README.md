# Locked In 

**Locked In** is a powerful Chrome extension designed to keep you on track with your goals. Powered by the built-in Gemini Nano Summarization API.

---

## Prerequisites

Before installing Locked In, please ensure you meet the following requirements:

1. Review and acknowledge [Google's Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy).
2. Install either the dev or canary Chrome channels (version ≥ 129):
   - [Chrome Dev](https://www.google.com/chrome/dev/)
   - [Chrome Canary](https://www.google.com/chrome/canary/)
3. System Requirements:
   - Minimum 22 GB free storage space.
   - At least 10 GB free space after installation.

## Setup

### Enable Gemini Nano and Summarization API

1. **Enable Gemini Nano Bypass:**
   - Navigate to `chrome://flags/#optimization-guide-on-device-model`.
   - Set to **"Enabled BypassPerfRequirement"**.

2. **Enable Summarization API:**
   - Navigate to `chrome://flags/#summarization-api-for-gemini-nano`.
   - Set to **"Enabled"**.

3. **Relaunch Chrome:**
   - Click the **"Relaunch"** button to apply the changes.

### Verify Gemini Nano Installation

1. **Open Chrome DevTools:**
   - Press `F12` or `Ctrl+Shift+I` to open DevTools.

2. **Check Gemini Nano and Summarization API Availability:**
   - In the console, run:
     ```javascript
     await self.ai.summarizer.capabilities()
     ```
     If you see `available: "readily"`, setup is complete.
     If it's `available: "after-download"`, wait for a little while longer.

3. **Check official docs:**
   - Take a look at the [official docs](https://developer.chrome.com/docs/ai/summarizer-api) if you need further help.


## **Installation**
### **Setup and Build the Extension**

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/tunahandanis/locked-in.git
   cd locked-in

2. **Install Dependencies:**
   ```bash
   npm install

3. **Build the Project:**
   ```bash
   npm run build

### **Load the Extension via Unpacked Method**

1. **Open Chrome Extensions Page:**
   - Open Chrome and type `chrome://extensions` in the address bar.

2. **Enable Developer Mode:**
   - Toggle the **"Developer mode"** switch in the top-right corner.

3. **Load Unpacked Extension:**
   - Click the **"Load unpacked"** button.
   - Select the folder where the Locked In code resides.

4. **Activate the Extension:**
   - Ensure the extension is toggled on.
   - You should now see the extension icon in your Chrome toolbar.

---

## **Usage**

1. **Access the Extension:**
   - Click the extension icon in the Chrome toolbar to open its interface.

2. **Set your focus session details:**
   - Set your goal, session duration and tracking mode. Then start tracking.

3. **Start Working:**
   - As you browse the web, Locked In will periodically scan the visible area on your active tab, run an analysis on the Offscreen with Summarization API and TensorFlow.js USE to check if you're distracted from your goal, and alert you depending on the result.