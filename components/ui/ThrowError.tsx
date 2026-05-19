'use client'

/** Dev-only: insert anywhere to test the nearest ErrorBoundary. Remove after testing. */
export default function ThrowError({ message = 'Test error' }: { message?: string }): never {
  throw new Error(message)
}
