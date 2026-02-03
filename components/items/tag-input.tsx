'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  disabled?: boolean
  placeholder?: string
}

export function TagInput({
  value,
  onChange,
  suggestions,
  disabled = false,
  placeholder = 'Add tags...',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on input and exclude already selected
  const filteredSuggestions = suggestions.filter(
    (tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(tag)
  )

  // Show suggestions when there's input and matches
  const shouldShowSuggestions =
    showSuggestions && inputValue.length > 0 && filteredSuggestions.length > 0

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim().toLowerCase()
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed])
      }
      setInputValue('')
      setShowSuggestions(false)
      setHighlightedIndex(-1)
      inputRef.current?.focus()
    },
    [value, onChange]
  )

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove))
    },
    [value, onChange]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addTag(filteredSuggestions[highlightedIndex])
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    } else if (e.key === ',' || e.key === 'Tab') {
      if (inputValue.trim()) {
        e.preventDefault()
        addTag(inputValue)
      }
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [inputValue])

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border border-foreground/20 bg-background px-3 py-2',
          'focus-within:ring-2 focus-within:ring-foreground/20 focus-within:ring-offset-2',
          disabled && 'opacity-50'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected tags */}
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-sm"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
                className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/20"
                aria-label={`Remove ${tag}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
              </button>
            )}
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[100px] flex-1 bg-transparent text-base outline-none placeholder:text-foreground/50"
        />
      </div>

      {/* Suggestions dropdown */}
      {shouldShowSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-foreground/20 bg-background shadow-lg">
          {filteredSuggestions.map((tag, index) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className={cn(
                'w-full px-3 py-2.5 text-left text-sm transition-colors',
                index === highlightedIndex
                  ? 'bg-foreground/10'
                  : 'hover:bg-foreground/5'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <p className="mt-1.5 text-xs text-foreground/50">
        Press Enter or comma to add a tag
      </p>
    </div>
  )
}
