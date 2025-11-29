import React from 'react';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-2">
      {replies.map((reply, index) => (
        <button
          key={index}
          onClick={() => onSelect(reply)}
          className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
