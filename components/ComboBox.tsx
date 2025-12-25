'use client'

import { useState, useRef, useEffect } from 'react'

interface ComboBoxProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  required?: boolean
  className?: string
}

export function ComboBox({ value, onChange, options, placeholder, required, className }: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Filter options based on current value
    if (value) {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [value, options])

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(true)
  }

  const handleOptionClick = (option: string) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        className={className}
        autoComplete="off"
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
          {filteredOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleOptionClick(option)}
              className="w-full text-left px-4 py-2 text-white hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
