// src/guide/Guide.tsx

import { h } from "preact"
import {
  ClipboardListIcon,
  InformationCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/solid"

const Guide = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <header className="bg-blue-800 py-5">
        <div className="container mx-auto px-6">
          <h1 className="text-2xl font-bold text-white text-center">
            Locked In - Guide
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center pl-2">
            <ClipboardListIcon className="h-6 w-6 text-blue-800 mr-2" />
            Setting Your Goal
          </h2>
          <p className="text-base mb-5 pl-2">
            Enter a clear and specific goal in the{" "}
            <strong>"What's your goal?"</strong> field. This helps the extension
            understand exactly what you want to focus on and keeps you on track.
          </p>

          <div className="bg-white shadow-md rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-3">Examples:</h3>

            <div className="mb-5 border-b border-gray-200 pb-5">
              <div className="flex items-start mb-2">
                <XCircleIcon className="h-5 w-5 text-red-600 mt-1 mr-2" />
                <div>
                  <p className="text-base font-semibold">Too Broad:</p>
                  <p className="text-base text-gray-700">"History"</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-1 mr-2" />
                <div>
                  <p className="text-base font-semibold">Better:</p>
                  <p className="text-base text-gray-700">
                    "Study the causes of World War II"
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5 border-b border-gray-200 pb-5">
              <div className="flex items-start mb-2">
                <XCircleIcon className="h-5 w-5 text-red-600 mt-1 mr-2" />
                <div>
                  <p className="text-base font-semibold">Too Vague:</p>
                  <p className="text-base text-gray-700">"Work stuff"</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-1 mr-2" />
                <div>
                  <p className="text-base font-semibold">Better:</p>
                  <p className="text-base text-gray-700">
                    "Prepare presentation slides on sales goals"
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start mb-2">
                <XCircleIcon className="h-5 w-5 text-red-600 mt-1 mr-2" />
                <div>
                  <p className="text-base font-semibold">Unclear:</p>
                  <p className="text-base text-gray-700">"Programming"</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-1 mr-2" />
                <div>
                  <p className="text-base font-semibold">Better:</p>
                  <p className="text-base text-gray-700">
                    "Learn about JavaScript closures"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center pl-2">
            <InformationCircleIcon className="h-6 w-6 text-blue-800 mr-2" />
            Understanding Tracking Modes
          </h2>

          <div className="mb-6 pl-2">
            <h3 className="text-lg font-semibold mb-2">Broad Mode</h3>
            <p className="text-base mb-3">
              Allows content that is broadly related to your goal. Useful when
              you want to explore general topics around your goal.
            </p>
          </div>

          <div className="pl-2">
            <h3 className="text-lg font-semibold mb-2">Specific Mode</h3>
            <p className="text-base mb-3">
              Keeps you focused strictly on content directly related to your
              goal. Best when you need to concentrate without distractions.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center pl-2">
            <ClockIcon className="h-6 w-6 text-blue-800 mr-2" />
            Duration
          </h2>
          <p className="text-base pl-2">
            Set the duration for your focus session in minutes. The extension
            will track your browsing during this period to help you stay on
            task. You will be notified when the session is over.
          </p>
        </section>
      </main>
    </div>
  )
}

export default Guide
