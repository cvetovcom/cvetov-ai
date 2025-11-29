import { ChatSession } from '@/types'
import { Check } from 'lucide-react'

interface ParamsProgressProps {
  params: ChatSession['params']
}

export function ParamsProgress({ params }: ParamsProgressProps) {
  const parameters = [
    { label: 'Кому', value: params.recipient, icon: '👤' },
    { label: 'Повод', value: params.occasion, icon: '🎁' },
    { label: 'Город', value: params.city?.name, icon: '📍' },
  ]

  const hasPrice = params.price !== null

  return (
    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
      <div className="flex items-center gap-4 max-w-3xl mx-auto">
        {parameters.map((param, index) => (
          <div key={param.label} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={`w-8 h-0.5 ${
                  param.value ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            )}

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                param.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span>{param.icon}</span>
              <span className="font-medium">
                {param.value || param.label}
              </span>
              {param.value && <Check className="w-3.5 h-3.5 text-primary-500" />}
            </div>
          </div>
        ))}

        {hasPrice && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-primary-500" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary-100 text-primary-700">
              <span>💰</span>
              <span className="font-medium">{params.price}</span>
              <Check className="w-3.5 h-3.5 text-primary-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
