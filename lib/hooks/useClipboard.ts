import { useState, useCallback } from 'react'

interface UseClipboardOptions {
  onError?: (error: Error) => void
}

interface UseClipboardReturn {
  isLoading: boolean
  readText: () => Promise<string | null>
  writeText: (text: string) => Promise<boolean>
}

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const [isLoading, setIsLoading] = useState(false)

  const readText = useCallback(async (): Promise<string | null> => {
    setIsLoading(true)
    try {
      const text = await navigator.clipboard.readText()
      return text
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to read clipboard')
      options.onError?.(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [options])

  const writeText = useCallback(async (text: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to write to clipboard')
      options.onError?.(err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [options])

  return {
    isLoading,
    readText,
    writeText,
  }
}
