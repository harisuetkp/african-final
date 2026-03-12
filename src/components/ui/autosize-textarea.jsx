import * as React from "react"
import { cn } from "@/lib/utils"

const AutoResizeTextarea = React.forwardRef(({ className, value, onChange, minHeight = 44, maxHeight = 200, ...props }, ref) => {
  const textareaRef = React.useRef(null)
  
  // Combine refs
  React.useImperativeHandle(ref, () => textareaRef.current)

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
    textarea.style.height = `${newHeight}px`
  }, [minHeight, maxHeight])

  React.useLayoutEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleChange = (e) => {
    adjustHeight()
    onChange?.(e)
  }

  return (
    <textarea
      ref={textareaRef}
      className={cn(
        "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden",
        className
      )}
      style={{ minHeight }}
      value={value}
      onChange={handleChange}
      {...props}
    />
  )
})
AutoResizeTextarea.displayName = "AutoResizeTextarea"

export { AutoResizeTextarea }