import { QuickReply } from '@/types'
import { Button } from '@/components/ui/button'

interface QuickRepliesProps {
  replies: QuickReply[]
  onSelect: (value: string) => void
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  if (replies.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 animate-slide-up">
      {replies.map((reply, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(reply.value)}
          className="rounded-full hover:border-primary-300 hover:bg-primary-50"
        >
          {reply.label}
        </Button>
      ))}
    </div>
  )
}
