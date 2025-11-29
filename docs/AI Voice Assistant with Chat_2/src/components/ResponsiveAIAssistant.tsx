import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Mic, MicOff, Send, Settings, Menu, X, MessageSquare, Zap, Volume2, User, Plus, Check, ChevronLeft, ChevronRight, ShoppingCart, Minus } from 'lucide-react';
import logoImage from 'figma:asset/12f57705d86ebb7693bf9594c73ade82881c2f99.png';

interface Product {
  id: string;
  name: string;
  shop: string;
  price: number;
  images: string[];
}

interface CartItem extends Product {
  quantity: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  quickReplies?: string[];
  products?: Product[];
}

interface CollectedData {
  recipient: string;
  occasion: string;
  city: string;
}

// Моковые данные товаров
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Букет "Розовая нежность"',
    shop: 'Цветочная лавка',
    price: 2890,
    images: [
      'https://images.unsplash.com/photo-1694796152188-497671aac01c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb3NlJTIwYm91cXVldCUyMGZsb3dlcnN8ZW58MXx8fHwxNzY0NDAzMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1580403072903-36afa4f4c9f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dWxpcCUyMGJvdXF1ZXQlMjBzcHJpbmd8ZW58MXx8fHwxNzY0NDE5MjE4fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ]
  },
  {
    id: '2',
    name: 'Тюльпаны весенние',
    shop: 'Флора экспресс',
    price: 1990,
    images: [
      'https://images.unsplash.com/photo-1580403072903-36afa4f4c9f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dWxpcCUyMGJvdXF1ZXQlMjBzcHJpbmd8ZW58MXx8fHwxNzY0NDE5MjE4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1709773628837-94e63fea4769?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWx5JTIwZmxvd2VycyUyMGVsZWdhbnR8ZW58MXx8fHwxNzY0NDIzNDU1fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ]
  },
  {
    id: '3',
    name: 'Лилии элегантные',
    shop: 'Цветочный рай',
    price: 3490,
    images: [
      'https://images.unsplash.com/photo-1709773628837-94e63fea4769?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWx5JTIwZmxvd2VycyUyMGVsZWdhbnR8ZW58MXx8fHwxNzY0NDIzNDU1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1656056970279-0cdd04b60434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW9ueSUyMGJvdXF1ZXQlMjBwaW5rfGVufDF8fHx8MTc2NDMyNTk0Nnww&ixlib=rb-4.1.0&q=80&w=1080'
    ]
  },
  {
    id: '4',
    name: 'Пионы розовые',
    shop: 'Букет.ру',
    price: 4290,
    images: [
      'https://images.unsplash.com/photo-1656056970279-0cdd04b60434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW9ueSUyMGJvdXF1ZXQlMjBwaW5rfGVufDF8fHx8MTc2NDMyNTk0Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1558885851-dc8076f4d8fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmNoaWQlMjBmbG93ZXJzJTIwd2hpdGV8ZW58MXx8fHwxNzY0NDIzNDU2fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ]
  },
  {
    id: '5',
    name: 'Орхидеи белые',
    shop: 'Цветочная лавка',
    price: 5490,
    images: [
      'https://images.unsplash.com/photo-1558885851-dc8076f4d8fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmNoaWQlMjBmbG93ZXJzJTIwd2hpdGV8ZW58MXx8fHwxNzY0NDIzNDU2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1643906667244-9f973edadb1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5mbG93ZXIlMjBib3VxdWV0JTIweWVsbG93fGVufDF8fHx8MTc2NDMyNTk0NXww&ixlib=rb-4.1.0&q=80&w=1080'
    ]
  },
  {
    id: '6',
    name: 'Подсолнухи солнечные',
    shop: 'Флора экспресс',
    price: 2490,
    images: [
      'https://images.unsplash.com/photo-1643906667244-9f973edadb1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5mbG93ZXIlMjBib3VxdWV0JTIweWVsbG93fGVufDF8fHx8MTc2NDMyNTk0NXww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1629379555555-79c361b3736b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoeWRyYW5nZWElMjBmbG93ZXJzJTIwYmx1ZXxlbnwxfHx8fDE3NjQzNzg3MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ]
  },
  {
    id: '7',
    name: 'Гортензия голубая',
    shop: 'Цветочный рай',
    price: 3890,
    images: [
      'https://images.unsplash.com/photo-1629379555555-79c361b3736b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoeWRyYW5nZWElMjBmbG93ZXJzJTIwYmx1ZXxlbnwxfHx8fDE3NjQzNzg3MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1642728265490-2ea6c3320880?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXhlZCUyMGZsb3dlciUyMGJvdXF1ZXR8ZW58MXx8fHwxNzY0Mzk1MjAzfDA&ixlib=rb-4.1.0&q=80&w=1080'
    ]
  },
  {
    id: '8',
    name: 'Микс "Радужный"',
    shop: 'Букет.ру',
    price: 3290,
    images: [
      'https://images.unsplash.com/photo-1642728265490-2ea6c3320880?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXhlZCUyMGZsb3dlciUyMGJvdXF1ZXR8ZW58MXx8fHwxNzY0Mzk1MjAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1694796152188-497671aac01c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb3NlJTIwYm91cXVldCUyMGZsb3dlcnN8ZW58MXx8fHwxNzY0NDAzMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ]
  }
];

// Компонент карточки товара
function ProductCard({ product, onSelect }: { product: Product; onSelect: (product: Product) => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Image Carousel */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={product.images[currentImageIndex]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {product.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
            
            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {product.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="text-sm mb-1 truncate">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-2 truncate">{product.shop}</p>
        <div className="flex items-center justify-between">
          <span className="text-gray-800">{product.price.toLocaleString()} ₽</span>
          <Button
            onClick={() => onSelect(product)}
            size="sm"
            className="bg-gray-800 hover:bg-gray-700 text-white h-8 px-3"
          >
            Выбрать
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ResponsiveAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [collectedData, setCollectedData] = useState<CollectedData>({
    recipient: '',
    occasion: '',
    city: ''
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<{ [messageId: string]: number }>({});
  const [orderForm, setOrderForm] = useState({
    recipientName: '',
    phone: '',
    address: '',
    deliveryDate: '',
    deliveryTime: '',
    comment: '',
    paymentMethod: 'card'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Функция для определения времени суток
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Доброе утро";
    } else if (hour >= 12 && hour < 18) {
      return "Добрый день";
    } else {
      return "Добрый вечер";
    }
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateAIResponse = (userMessage: string): { text: string; quickReplies?: string[]; products?: Product[] } => {
    // Check what data we still need to collect
    if (!collectedData.recipient) {
      // Save the recipient
      setCollectedData(prev => ({ ...prev, recipient: userMessage }));
      return {
        text: "Отлично! Теперь подскажите, пожалуйста, по какому поводу?",
        quickReplies: ["День рождения", "Юбилей", "8 Марта", "Просто так"]
      };
    } else if (!collectedData.occasion) {
      // Save the occasion
      setCollectedData(prev => ({ ...prev, occasion: userMessage }));
      return {
        text: "Замечательно! И последний вопрос - в каком городе вы находитесь?",
        quickReplies: ["Москва", "Санкт-Петербург", "Казань", "Другой город"]
      };
    } else if (!collectedData.city) {
      // Save the city
      setCollectedData(prev => ({ ...prev, city: userMessage }));
      return {
        text: `Спасибо! Я собрал всю информацию:\n\n✓ Кому: ${collectedData.recipient}\n✓ Повод: ${collectedData.occasion}\n✓ Город: ${userMessage}\n\nТеперь я могу помочь вам с подбором подарка. Что вас интересует?`,
        quickReplies: ["Букет цветов", "Подарочный набор", "Сладости", "Показать всё"]
      };
    } else {
      // All data collected, provide regular assistance
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('спасибо') || lowerMessage.includes('благодар')) {
        return {
          text: "Пожалуйста! Рад помочь. Есть ещё вопросы?",
          quickReplies: ["Начать заново", "Изменить параметры", "Нет, спасибо"]
        };
      } else if (lowerMessage.includes('цветы') || lowerMessage.includes('букет')) {
        return {
          text: `Для подарка "${collectedData.occasion}" в городе ${collectedData.city} могу предложить красивые букеты. Какой бюджет вы рассматриваете?`,
          quickReplies: ["До 3000₽", "3000-5000₽", "5000-10000₽", "Премиум"]
        };
      } else if (lowerMessage.includes('бюджет') || lowerMessage.includes('цена') || lowerMessage.includes('стоимость') || lowerMessage.includes('₽')) {
        return {
          text: "Отлично! Вот что я подобрал для вас:",
          products: MOCK_PRODUCTS
        };
      } else if (lowerMessage.includes('премиум')) {
        return {
          text: "Подобрал для вас премиальные букеты:",
          products: MOCK_PRODUCTS.filter(p => p.price > 3000)
        };
      } else {
        return {
          text: "Я могу помочь с выбором подарка. Что вас интересует?",
          quickReplies: ["Букет цветов", "Подарочный набор", "Сладости", "Другое"]
        };
      }
    }
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowChat(true);
    setInputText('');

    // Generate AI response
    setTimeout(() => {
      const response = generateAIResponse(messageText);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        quickReplies: response.quickReplies,
        products: response.products
      };
      setMessages(prev => [...prev, aiResponse]);
      
      // Initialize visible products count for this message
      if (response.products && response.products.length > 0) {
        setVisibleProducts(prev => ({ ...prev, [aiResponse.id]: 4 }));
      }
      
      // If this is the first message, start the data collection
      if (messages.length === 0) {
        setTimeout(() => {
          const welcomeMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: "Здравствуйте! Помогу вам подобрать подарок. Для начала, скажите, пожалуйста, кому вы ищете подарок? (например: маме, другу, коллеге)",
            sender: 'ai',
            timestamp: new Date(),
            quickReplies: ["Маме", "Другу", "Коллеге", "Любимой"]
          };
          setMessages(prev => [...prev, welcomeMessage]);
        }, 500);
      }
    }, 1000);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleSelectProduct = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) {
            return null;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleShowMoreProducts = (messageId: string) => {
    setVisibleProducts(prev => ({
      ...prev,
      [messageId]: (prev[messageId] || 4) + 4
    }));
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    // Подставляем данные из собранной информации
    setOrderForm(prev => ({
      ...prev,
      recipientName: collectedData.recipient || '',
      address: collectedData.city || ''
    }));
    setShowCheckout(true);
  };

  const handleSubmitOrder = () => {
    // Здесь будет логика отправки заказа
    alert('Заказ оформлен! Спасибо за покупку.');
    setShowCheckout(false);
    setCart([]);
    setOrderForm({
      recipientName: '',
      phone: '',
      address: '',
      deliveryDate: '',
      deliveryTime: '',
      comment: '',
      paymentMethod: 'card'
    });
  };

  const handleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSpeak = (text: string) => {
    if (!speechSynthesis) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-white flex">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)}>
          <div className="absolute left-0 top-0 h-full w-80 bg-gray-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white">AI Ассистент</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSidebar(false)}
                  className="text-white hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <Button className="w-full mb-4 bg-transparent border border-gray-600 text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Новый чат
              </Button>

              <div className="space-y-1">
                <div className="text-xs text-gray-400 px-3 py-2">Недавние</div>
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800 truncate">
                  <MessageSquare className="w-4 h-4 mr-3 shrink-0" />
                  <span className="truncate text-left">Предыдущий разговор...</span>
                </Button>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                <User className="w-4 h-4 mr-3" />
                Аккаунт
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                <Settings className="w-4 h-4 mr-3" />
                Настройки
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-gray-900 shrink-0">
        <div className="p-3">
          <Button className="w-full bg-transparent border border-gray-600 text-white hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Новый чат
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          <div className="text-xs text-gray-400 px-3 py-2">Недавние</div>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800 mb-1 truncate">
            <MessageSquare className="w-4 h-4 mr-3 shrink-0" />
            <span className="truncate text-left">Предыдущий разговор...</span>
          </Button>
        </div>

        <div className="p-3 border-t border-gray-700">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800 mb-1">
            <User className="w-4 h-4 mr-3" />
            Аккаунт
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
            <Settings className="w-4 h-4 mr-3" />
            Настройки
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center h-14 px-4 border-b border-gray-200">
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden mr-2"
            onClick={() => setShowSidebar(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-gray-800">Цветов.ру AI</h1>
          
          {showChat && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto"
              onClick={() => setShowChat(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {!showChat ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              {/* Logo */}
              <div className="mb-8">
                <div className="w-20 h-20 lg:w-24 lg:h-24 relative">
                  <img 
                    src={logoImage} 
                    alt="AI Ассистент"
                    className="w-full h-full object-contain rounded-2xl"
                  />
                  {(isListening || isSpeaking) && (
                    <div className="absolute inset-0 border-4 border-red-500 rounded-2xl animate-ping"></div>
                  )}
                </div>
              </div>

              {/* Welcome Text */}
              <div className="space-y-4 mb-8">
                <h2 className="text-3xl lg:text-5xl text-gray-800">{getGreeting()}</h2>
                <p className="text-xl text-gray-600">Какой букет и кому сегодня подбираем?</p>
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                <button 
                  onClick={() => setShowChat(true)}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-gray-600 shrink-0 mt-1" />
                    <div>
                      <div className="text-gray-700 mb-1">Начать разговор</div>
                      <div className="text-sm text-gray-500">Начните общение с AI ассистентом</div>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={handleVoiceInput}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3">
                    {isListening ? (
                      <MicOff className="w-5 h-5 text-red-500 shrink-0 mt-1" />
                    ) : (
                      <Mic className="w-5 h-5 text-gray-400 group-hover:text-gray-600 shrink-0 mt-1" />
                    )}
                    <div>
                      <div className="text-gray-700 mb-1">{isListening ? 'Остановить прослушивание' : 'Голосовой ввод'}</div>
                      <div className="text-sm text-gray-500">Говорите вместо ввода текста</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <div className="h-full flex flex-col">
              {/* Status Bar - показываем собранные парам��тры */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="max-w-3xl mx-auto px-4 py-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Кому */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                      collectedData.recipient 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {collectedData.recipient ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Кому: {collectedData.recipient}</span>
                        </>
                      ) : (
                        <span>Кому: не указано</span>
                      )}
                    </div>

                    {/* Повод */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                      collectedData.occasion 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {collectedData.occasion ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Повод: {collectedData.occasion}</span>
                        </>
                      ) : (
                        <span>Повод: не указано</span>
                      )}
                    </div>

                    {/* Город */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                      collectedData.city 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {collectedData.city ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Город: {collectedData.city}</span>
                        </>
                      ) : (
                        <span>Город: не указано</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-6">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Начните разговор...</p>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-6 ${message.sender === 'user' ? 'flex justify-end' : ''}`}
                    >
                      <div className={`${message.sender === 'user' ? 'max-w-[80%]' : 'w-full'}`}>
                        <div className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                          {/* Avatar */}
                          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            message.sender === 'user' 
                              ? 'bg-gray-800' 
                              : 'bg-gradient-to-br from-purple-500 to-pink-500'
                          }`}>
                            {message.sender === 'user' ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            )}
                          </div>

                          {/* Message Content */}
                          <div className="flex-1">
                            <div className={`rounded-2xl px-4 py-3 ${
                              message.sender === 'user' 
                                ? 'bg-gray-100 text-gray-800' 
                                : 'bg-transparent text-gray-800'
                            }`}>
                              <p className="whitespace-pre-wrap">{message.text}</p>
                            </div>
                            
                            {/* Products Grid */}
                            {message.sender === 'ai' && message.products && message.products.length > 0 && (
                              <div className="mt-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {message.products.slice(0, visibleProducts[message.id] || 4).map((product) => (
                                    <ProductCard
                                      key={product.id}
                                      product={product}
                                      onSelect={handleSelectProduct}
                                    />
                                  ))}
                                </div>
                                
                                {message.products.length > (visibleProducts[message.id] || 4) && (
                                  <button
                                    onClick={() => handleShowMoreProducts(message.id)}
                                    className="mt-3 w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    Еще варианты
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Quick Reply Buttons */}
                            {message.sender === 'ai' && message.quickReplies && message.quickReplies.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3 px-2">
                                {message.quickReplies.map((reply, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleQuickReply(reply)}
                                    className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    {reply}
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2 px-2">
                              <span className="text-xs text-gray-400">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                              {message.sender === 'ai' && (
                                <button
                                  onClick={() => handleSpeak(message.text)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Volume2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cart Sidebar - показываем над полем ввода */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-3">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                <h3 className="text-gray-800">Корзина</h3>
              </div>
              
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-lg">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.price.toLocaleString()} ₽</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
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
                onClick={handleCheckout}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white"
              >
                Оформить заказ
              </Button>
            </div>
          </div>
        )}

        {/* Chat Input - Always at bottom */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="relative">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Сообщение AI ассистенту..."
                    className="pr-10 py-6 border-gray-300 rounded-3xl focus:ring-2 focus:ring-gray-300 focus:border-transparent resize-none"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute right-2 bottom-2 h-8 w-8 p-0 ${
                      isListening ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    onClick={handleVoiceInput}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button 
                  onClick={() => handleSendMessage()} 
                  disabled={!inputText.trim()}
                  className="h-12 w-12 rounded-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400 p-0 shrink-0"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              
              {isListening && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Слушаю...
                  </p>
                </div>
              )}
              
              {isSpeaking && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Говорю...
                  </p>
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-400 text-center mt-3">
              AI ассистент может допускать ошибки. Пожалуйста, проверяйте важную информацию.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl text-gray-800">Оформление заказа</h2>
              <button
                onClick={() => setShowCheckout(false)}
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
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate mb-1">{item.name}</p>
                        <p className="text-xs text-gray-500 mb-1">{item.shop}</p>
                        <p className="text-sm text-gray-700">{item.quantity} × {item.price.toLocaleString()} ₽</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-800">{(item.price * item.quantity).toLocaleString()} ₽</p>
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
                    <Input
                      type="date"
                      value={orderForm.deliveryDate}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Время доставки
                    </label>
                    <Input
                      type="time"
                      value={orderForm.deliveryTime}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryTime: e.target.value }))}
                      className="w-full"
                    />
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
                  <span className="text-gray-600">Товары ({cart.reduce((sum, item) => sum + item.quantity, 0)} шт.)</span>
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
                onClick={handleSubmitOrder}
                disabled={!orderForm.recipientName || !orderForm.phone || !orderForm.address || !orderForm.deliveryDate}
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
      )}
    </div>
  );
}
