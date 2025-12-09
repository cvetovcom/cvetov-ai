import React from 'react';
import { Check } from 'lucide-react';
import type { SessionParams } from '@/types';

interface ParamsProgressProps {
  params: SessionParams;
}

export function ParamsProgress({ params }: ParamsProgressProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {/* Кому */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            params.recipient
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {params.recipient ? (
              <>
                <Check className="w-4 h-4" />
                <span>Кому: {params.recipient}</span>
              </>
            ) : (
              <span>Кому: не указано</span>
            )}
          </div>

          {/* Повод */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            params.occasion
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {params.occasion ? (
              <>
                <Check className="w-4 h-4" />
                <span>Повод: {params.occasion}</span>
              </>
            ) : (
              <span>Повод: не указано</span>
            )}
          </div>

          {/* Город */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            params.city
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {params.city ? (
              <>
                <Check className="w-4 h-4" />
                <span>Город: {params.city.name}</span>
              </>
            ) : (
              <span>Город: не указано</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
