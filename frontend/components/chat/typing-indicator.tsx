export function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 animate-slide-up">
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
        <span className="text-sm">🤖</span>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
}
