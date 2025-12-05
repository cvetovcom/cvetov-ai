import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import type { CartItem, OrderData, SessionParams } from '@/types';

interface TimeSlot {
  start_time: string;
  end_time: string;
  weekday?: string;
  shop_uuid?: string;
  timeslot_date?: string;
}

interface CheckoutModalProps {
  cart: CartItem[];
  sessionParams: SessionParams;
  onClose: () => void;
  onSubmit: (orderData: OrderData) => void;
  getTotalPrice: () => number;
}

export function CheckoutModal({ cart, sessionParams, onClose, onSubmit, getTotalPrice }: CheckoutModalProps) {
  // Получаем сегодняшнюю дату по умолчанию
  const getDefaultDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [orderForm, setOrderForm] = useState({
    recipientName: '',
    phone: '',
    address: sessionParams.delivery_address || '',
    deliveryDate: sessionParams.delivery_date || getDefaultDate(),
    deliveryTime: sessionParams.delivery_time || '',
    comment: '',
    paymentMethod: 'card',
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Вычисляем min и max даты для валидации
  const getDateLimits = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 20);

    return {
      min: today.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0],
    };
  };

  const dateLimits = getDateLimits();

  // Обработчик изменения даты
  const handleDateChange = (newDate: string) => {
    setOrderForm(prev => ({ ...prev, deliveryDate: newDate, deliveryTime: '' }));
    setTimeSlots([]);
    setSlotsError(null);
  };

  // Загрузка временных слотов при изменении даты
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!orderForm.deliveryDate || cart.length === 0) {
        return;
      }

      const shopId = cart[0].shop_public_uuid;
      console.log('[CheckoutModal] Fetching time slots for shop:', shopId, 'date:', orderForm.deliveryDate);
      setLoadingSlots(true);
      setSlotsError(null);

      try {
        const url = `https://mcp.cvetov24.ru/api/v2/shops/${shopId}/day_time_slots?date=${orderForm.deliveryDate}`;
        console.log('[CheckoutModal] Time slots URL:', url);

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[CheckoutModal] Time slots API error:', response.status, errorText);
          throw new Error('Не удалось загрузить временные слоты');
        }

        const data = await response.json();
        console.log('[CheckoutModal] Time slots response:', data);
        console.log('[CheckoutModal] First slot structure:', data.length > 0 ? data[0] : 'empty');

        if (data && Array.isArray(data) && data.length > 0) {
          // Фильтруем слоты по выбранной дате
          const filteredSlots = data.filter((slot: TimeSlot) => slot.timeslot_date === orderForm.deliveryDate);
          console.log('[CheckoutModal] Filtered slots for date', orderForm.deliveryDate, ':', filteredSlots.length);

          if (filteredSlots.length > 0) {
            setTimeSlots(filteredSlots);
          } else {
            setSlotsError('Нет доступных слотов для выбранной даты');
            setTimeSlots([]);
          }
        } else {
          setSlotsError('Нет доступных слотов для выбранной даты');
          setTimeSlots([]);
        }
      } catch (error) {
        console.error('[CheckoutModal] Error fetching time slots:', error);
        setSlotsError('Ошибка загрузки временных слотов');
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchTimeSlots();
  }, [orderForm.deliveryDate, cart]);

  const handleSubmit = () => {
    const orderData: OrderData = {
      customer: {
        name: orderForm.recipientName,
        phone: orderForm.phone,
        address: orderForm.address,
        comment: orderForm.comment,
      },
      items: cart.map((item) => ({
        product_id: item.guid,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price.final_price,
      })),
      total: getTotalPrice(),
      payment_method: orderForm.paymentMethod as 'card' | 'cash',
      delivery_date: orderForm.deliveryDate || undefined,
      delivery_time: orderForm.deliveryTime || undefined,
    };

    onSubmit(orderData);
  };

  const isFormValid = orderForm.recipientName && orderForm.phone && orderForm.address && orderForm.deliveryDate && orderForm.deliveryTime;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl text-gray-800">Оформление заказа</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-gray-800 mb-3">Ваш заказ</h3>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.guid} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={item.main_image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate mb-1">{item.name}</p>
                    {item.shop_name && (
                      <p className="text-xs text-gray-500 mb-1">{item.shop_name}</p>
                    )}
                    <p className="text-sm text-gray-700">
                      {item.quantity} × {item.price.final_price.toLocaleString()} ₽
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-800">
                      {(item.price.final_price * item.quantity).toLocaleString()} ₽
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Form */}
          <div className="space-y-4 mb-6">
            <h3 className="text-gray-800 mb-3">Данные доставки</h3>
            
            {/* Recipient Name */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Имя получателя <span className="text-red-500">*</span>
              </label>
              <Input
                value={orderForm.recipientName}
                onChange={(e) => setOrderForm(prev => ({ ...prev, recipientName: e.target.value }))}
                placeholder="Введите имя получателя"
                className="w-full"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Телефон <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                value={orderForm.phone}
                onChange={(e) => setOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (___) ___-__-__"
                className="w-full"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Адрес доставки <span className="text-red-500">*</span>
              </label>
              <Input
                value={orderForm.address}
                onChange={(e) => setOrderForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Город, улица, дом, квартира"
                className="w-full"
              />
            </div>

            {/* Delivery Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Дата доставки <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={orderForm.deliveryDate}
                  min={dateLimits.min}
                  max={dateLimits.max}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Время доставки <span className="text-red-500">*</span>
                </label>
                {!orderForm.deliveryDate ? (
                  <div className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center text-sm text-gray-400">
                    Выберите дату
                  </div>
                ) : loadingSlots ? (
                  <div className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center text-sm text-gray-500">
                    Загрузка слотов...
                  </div>
                ) : slotsError ? (
                  <div className="w-full h-10 px-3 py-2 border border-red-300 rounded-lg bg-red-50 flex items-center text-sm text-red-600">
                    {slotsError}
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center text-sm text-gray-400">
                    Нет слотов
                  </div>
                ) : (
                  <select
                    value={orderForm.deliveryTime}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryTime: e.target.value }))}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent text-sm"
                  >
                    <option value="">Выберите время</option>
                    {timeSlots.map((slot, index) => (
                      <option key={index} value={`${slot.start_time}-${slot.end_time}`}>
                        {slot.start_time} - {slot.end_time}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Комментарий к заказу
              </label>
              <textarea
                value={orderForm.comment}
                onChange={(e) => setOrderForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Особые пожелания, инструкции по доставке..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Способ оплаты <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={orderForm.paymentMethod === 'card'}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Картой онлайн</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={orderForm.paymentMethod === 'cash'}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Наличными при получении</span>
                </label>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">
                Товары ({cart.reduce((sum, item) => sum + item.quantity, 0)} шт.)
              </span>
              <span className="text-gray-800">{getTotalPrice().toLocaleString()} ₽</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Доставка</span>
              <span className="text-gray-800">Бесплатно</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-lg text-gray-800">Итого</span>
              <span className="text-xl text-gray-800">{getTotalPrice().toLocaleString()} ₽</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white disabled:bg-gray-300 disabled:text-gray-500 h-12"
          >
            Подтвердить заказ
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных
          </p>
        </div>
      </div>
    </div>
  );
}
