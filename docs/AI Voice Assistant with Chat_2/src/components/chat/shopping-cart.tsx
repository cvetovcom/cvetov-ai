import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart as ShoppingCartIcon, Plus, Minus, X } from 'lucide-react';
import type { CartItem } from '@/types';

interface ShoppingCartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  getTotalPrice: () => number;
}

export function ShoppingCart({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  getTotalPrice 
}: ShoppingCartProps) {
  if (cart.length === 0) return null;

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCartIcon className="w-5 h-5 text-gray-700" />
          <h3 className="text-gray-800">Корзина</h3>
        </div>
        
        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-lg">
              <img
                src={item.main_image}
                alt={item.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{item.price.final_price.toLocaleString()} ₽</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-700">Итого:</span>
          <span className="text-gray-800">{getTotalPrice().toLocaleString()} ₽</span>
        </div>
        
        <Button 
          onClick={onCheckout}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white"
        >
          Оформить заказ
        </Button>
      </div>
    </div>
  );
}
