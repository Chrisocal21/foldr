import { createWorker } from 'tesseract.js'

let worker: Awaited<ReturnType<typeof createWorker>> | null = null

async function getWorker() {
  if (!worker) {
    worker = await createWorker('eng')
  }
  return worker
}

export async function extractTextFromImage(imageData: string): Promise<string> {
  try {
    const workerInstance = await getWorker()
    const { data: { text } } = await workerInstance.recognize(imageData)
    return text.trim()
  } catch (error) {
    console.error('OCR Error:', error)
    return ''
  }
}

export async function terminateWorker() {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}
