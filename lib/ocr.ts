import { createWorker } from 'tesseract.js'

let worker: Awaited<ReturnType<typeof createWorker>> | null = null
let workerFailed = false

async function getWorker() {
  // If worker creation failed before, don't retry in this session
  if (workerFailed) {
    return null
  }
  
  if (!worker) {
    try {
      // Set a timeout for worker creation (10 seconds)
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Worker creation timeout')), 10000)
      })
      
      const workerPromise = createWorker('eng')
      worker = await Promise.race([workerPromise, timeoutPromise]) as Awaited<ReturnType<typeof createWorker>>
    } catch (error) {
      console.warn('OCR worker creation failed (offline or network issue):', error)
      workerFailed = true
      return null
    }
  }
  return worker
}

export async function extractTextFromImage(imageData: string): Promise<string> {
  try {
    const workerInstance = await getWorker()
    
    // If worker couldn't be created (offline), return empty string gracefully
    if (!workerInstance) {
      console.log('OCR skipped - worker not available (offline mode)')
      return ''
    }
    
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
