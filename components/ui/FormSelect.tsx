'use client'

import { useState, useRef, useEffect, useId, useCallback } from 'react'
import type { SelectOption } from '@/lib/types'

export type { SelectOption }

interface Props {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  'aria-label'?: string
}

export default function FormSelect({
  id,
  value,
  onChange,
  options,
  placeholder = '— Select —',
  required,
  disabled,
  'aria-label': ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const uid = useId()
  const listId = `${uid}-list`

  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  const close = useCallback(() => {
    setOpen(false)
    setFocusedIndex(-1)
  }, [])

  const select = useCallback(
    (val: string) => {
      onChange(val)
      close()
      triggerRef.current?.focus()
    },
    [onChange, close],
  )

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [close])

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const li = listRef.current.children[focusedIndex] as HTMLElement | undefined
      li?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setFocusedIndex(options.findIndex((o) => o.value === value) ?? 0)
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (focusedIndex >= 0) select(options[focusedIndex].value)
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      close()
      triggerRef.current?.focus()
    } else if (e.key.length === 1) {
      // Type-ahead
      const char = e.key.toLowerCase()
      const start = focusedIndex + 1
      const idx = [...options.slice(start), ...options.slice(0, start)].findIndex((o) =>
        o.label.toLowerCase().startsWith(char),
      )
      if (idx >= 0) {
        const real = (start + idx) % options.length
        setFocusedIndex(real)
      }
    }
  }

  const isOpen = open && !disabled

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-label={ariaLabel}
        aria-required={required}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((v) => !v)
            if (!open) setFocusedIndex(options.findIndex((o) => o.value === value))
          }
        }}
        onKeyDown={onTriggerKeyDown}
        className={[
          'flex h-11 w-full items-center justify-between rounded border bg-white px-3.5 text-[15px] transition-colors focus:border-brand focus:shadow-[0_0_0_3px_rgba(255,143,28,0.12)] focus:outline-none',
          value ? 'text-uni-black' : 'text-[#A0A0A0]',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          isOpen
            ? 'border-brand shadow-[0_0_0_3px_rgba(255,143,28,0.12)]'
            : 'border-uni-input-border hover:border-[#B0B0B0]',
        ].join(' ')}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={[
            'ml-2 shrink-0 text-[#8D8D8D] transition-transform duration-200',
            isOpen ? 'rotate-180' : '',
          ].join(' ')}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Hidden input for native form required validation */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        required={required}
        value={value}
        onChange={() => {}}
        className="absolute opacity-0 pointer-events-none w-full h-full top-0 left-0"
      />

      {/* Dropdown panel */}
      {isOpen && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          onKeyDown={onListKeyDown}
          tabIndex={-1}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-y-auto rounded-lg border border-uni-border bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            const isFocused = i === focusedIndex
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                id={`${uid}-opt-${i}`}
                onClick={() => select(opt.value)}
                onMouseEnter={() => setFocusedIndex(i)}
                className={[
                  'flex cursor-pointer items-center gap-2 px-3.5 py-2.5 text-[15px] transition-colors',
                  isFocused || isSelected ? 'bg-[#FFF6EE]' : 'hover:bg-[#FFF6EE]',
                  isSelected ? 'font-medium text-brand' : 'text-uni-black',
                ].join(' ')}
              >
                {/* Checkmark for selected */}
                <span className="flex w-4 shrink-0 items-center justify-center">
                  {isSelected && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                {opt.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
