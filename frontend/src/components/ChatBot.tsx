import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, RotateCcw, Copy, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { useLanguage } from '../hooks/useLanguage';
import { aiService } from '../services/aiService';
import { chatHistoryAPI, type ChatMessage as APIChatMessage } from '../services/apiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  reactions?: 'like' | 'dislike' | null;
  truncated?: boolean; // whether this AI message was intentionally truncated
  topicHint?: string; // optional topic hint for expansion
}

const welcomeMessages = {
  en: "Hi! I'm Kisanसाथी AI 🌾 Ask me anything about farming - crops, soil, weather, prices, or schemes. How can I help you today?",
  hi: "नमस्ते! मैं किसान साथी AI हूँ 🌾 खेती के बारे में कुछ भी पूछें - फसल, मिट्टी, मौसम, भाव या योजनाएं। आज कैसे मदद करूं?",
  mr: "नमस्कार! मी किसान साथी AI आहे 🌾 शेतकीबद्दल काहीही विचारा - पीक, माती, हवामान, भाव किंवा योजना. आज कशी मदत करू?"
};

const quickSuggestions = {
  en: [
    "Best crops for this season?",
    "How to plant rice?",
    "How to prevent crop diseases?",
    "Current market prices for tomatoes",
    "Government schemes for irrigation",
    "Pest control tips",
    "Weather advice for sowing",
    "How to apply for PM-KISAN?"
  ],
  hi: [
    "इस सीजन की बेस्ट फसल?",
    "धान कैसे लगाएं?",
    "फसल रोग कैसे रोकें?",
    "टमाटर के बाजार भाव",
    "सिंचाई के लिए सरकारी योजना",
    "कीट नियंत्रण के उपाय",
    "बुवाई के लिए मौसम सलाह",
    "पीएम-किसान के लिए आवेदन कैसे करें?"
  ],
  mr: [
    "या हंगामातील बेस्ट पीक?",
    "तांदूळ कसा लावायचा?",
    "पिकांचे रोग कसे टाळायचे?",
    "टोमॅटोचे बाजार भाव",
    "सिंचनासाठी सरकारी योजना",
    "कीटक नियंत्रण टिप्स",
    "पेरणीसाठी हवामानाचा सल्ला",
    "PM-KISAN साठी अर्ज कसा करावा?"
  ]
};

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [awaitingLocation, setAwaitingLocation] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [farmerLocation, setFarmerLocation] = useState<string | null>(null);
  const [fullResponses, setFullResponses] = useState<Record<string, string>>({}); // store original untrimmed AI text
  const [currentCrop, setCurrentCrop] = useState<string | null>(null);
  const [currentDisease, setCurrentDisease] = useState<string | null>(null);
  const [sessionId] = useState<string>(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { isListening, startListening, stopListening, speak, isSpeaking } = useVoice();
  const { language, t } = useLanguage();

  // Welcome message when opening
  // Load persisted chat state
  useEffect(() => {
    try {
      const raw = localStorage.getItem('kisanChatMessages');
      if (raw) {
        type PersistedMessage = Omit<Message, 'timestamp'> & { timestamp: string };
        const parsed: PersistedMessage[] = JSON.parse(raw);
        const restored: Message[] = parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        if (restored.length) setMessages(restored);
      }
      const loc = localStorage.getItem('kisanChatLocation');
      if (loc) setFarmerLocation(loc);
      const openState = localStorage.getItem('kisanChatOpen');
      if (openState === '1') setIsOpen(true);
    } catch (e) {
      console.warn('Restore failed', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) localStorage.setItem('kisanChatOpen', '1');
    else localStorage.removeItem('kisanChatOpen');
  }, [isOpen]);

  // Persist messages (exclude typing placeholders)
  useEffect(() => {
    try {
      const persistable = messages.filter(m => !m.isTyping).map(m => ({ ...m, timestamp: m.timestamp.toISOString() }));
      localStorage.setItem('kisanChatMessages', JSON.stringify(persistable));
    } catch {
      // Ignore persistence errors
    }
  }, [messages]);

  useEffect(() => {
    if (farmerLocation) localStorage.setItem('kisanChatLocation', farmerLocation);
  }, [farmerLocation]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: welcomeMessages[language as keyof typeof welcomeMessages] || welcomeMessages.en,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, language, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const reactToMessage = (messageId: string, reaction: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, reactions: msg.reactions === reaction ? null : reaction }
        : msg
    ));
  };

  const formatResponse = (text: string, userText: string): { formatted: string; truncated: boolean; topicHint?: string } => {
    const topicHint = userText.split(/[.?!]/)[0].slice(0, 60);
    const cleaned = text
      .replace(/\b(Namaste|Namaskar|Hello|Hi)\b[!.:]*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length > 480) {
      // Keep roughly first ~3 sentences or 480 chars whichever first
      const sentences = cleaned.split(/(?<=[.!?])\s+/);
      const acc: string[] = [];
      let total = 0;
      for (const s of sentences) {
        if (total + s.length > 380) break;
        acc.push(s);
        total += s.length;
        if (acc.length >= 4) break;
      }
      const shortResponse = acc.join(' ').trim();
      return {
        formatted: shortResponse + '\n\n💡 More detail available – click "More detail" below to expand.',
        truncated: true,
        topicHint
      };
    }
    // Add bullet normalization: convert lines starting with hyphen to dot
    const bulletified = cleaned.replace(/^[-*]\s+/gm, '• ');
    return { formatted: bulletified, truncated: false, topicHint };
  };
  // Simple off-topic detector (client-side) with conversation awareness
  const isOffTopic = (text: string, aiAskedLocation: boolean): boolean => {
    const lower = text.toLowerCase();
    const agKeywords = [
      // General
      'crop', 'farm', 'farming', 'soil', 'seed', 'plant', 'sow', 'nursery', 'irrigation', 'harvest', 'yield', 'agriculture', 'agri',
      // Inputs / management
      'fertilizer', 'pesticide', 'manure', 'compost', 'organic', 'mulch', 'drip', 'spray', 'weed', 'disease', 'pest',
      // Prices / schemes
      'price', 'market', 'mandi', 'scheme', 'subsidy', 'loan', 'pm-kisan', 'kcc',
      // Machinery
      'tractor', 'implement', 'sprayer',
      // Crops (staples / cash / horticulture)
      'rice', 'paddy', 'wheat', 'maize', 'corn', 'millet', 'bajra', 'jowar', 'ragi', 'soybean', 'cotton', 'sugarcane', 'pulse', 'lentil', 'gram', 'tur', 'arhar', 'urad', 'moong', 'groundnut', 'peanut', 'mustard', 'rapeseed', 'sunflower', 'potato', 'onion', 'tomato', 'chilli', 'brinjal', 'okra', 'cabbage', 'cauliflower', 'mango', 'banana', 'coconut', 'papaya', 'guava', 'grape', 'pomegranate'
    ];
    const locationTokens = ['location', 'land', 'acre', 'hectare', 'area', 'mumbai', 'maharashtra', 'pune', 'nashik', 'nagpur', 'delhi', 'punjab', 'haryana', 'uttar', 'karnataka', 'gujarat', 'bihar', 'kolkata', 'west bengal', 'rajasthan'];
    const agMatch = [...agKeywords, ...locationTokens].some(k => lower.includes(k));
    const plantingPattern = /(how to|best way to)?\s*(plant|grow|sow)\s+[a-z]{2,}/i.test(text);
    const unrelated = /(movie|football|game console|celebrity|bitcoin|programming|software|social media)/i.test(lower);
    if (aiAskedLocation && /^(near|in|from)?\s*[a-z ,.-]{2,40}$/i.test(text) && !unrelated) return false;
    // Off-topic only if unrelated OR (no agricultural match AND not a planting pattern)
    return unrelated || (!agMatch && !plantingPattern && !aiAskedLocation);
  };

  // Extract crop and disease mentions (simple heuristic)
  const updateContextFromUser = (text: string) => {
    const lower = text.toLowerCase();
    const cropList = ['tomato', 'potato', 'chilli', 'rice', 'paddy', 'wheat', 'maize', 'corn', 'soybean', 'cotton', 'sugarcane', 'onion', 'garlic', 'banana', 'mango', 'grape', 'pomegranate', 'groundnut', 'peanut'];
    const diseaseList = ['late blight', 'early blight', 'powdery mildew', 'downy mildew', 'bacterial wilt', 'leaf curl', 'blast', 'stem borer', 'fruit borer'];
    const foundCrop = cropList.find(c => lower.includes(c));
    const foundDisease = diseaseList.find(d => lower.includes(d));
    if (foundCrop && foundCrop !== currentCrop) setCurrentCrop(foundCrop);
    if (foundDisease && foundDisease !== currentDisease) setCurrentDisease(foundDisease);
  };

  const sendMessage = async (messageText?: string, addUserMessage = true) => {
    const raw = messageText || inputMessage.trim();
    let text = raw;
    if (!text || isLoading) return;

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      let updatedMessages = messages;

      if (addUserMessage) {
        const userMessage: Message = {
          id: Date.now().toString(),
          text,
          sender: 'user',
          timestamp: new Date()
        };
        updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputMessage('');
      }

      const typingMessage: Message = {
        id: 'typing-' + Date.now(),
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        isTyping: true
      };
      setMessages([...updatedMessages, typingMessage]);

      // If previous AI asked for location and user now supplied it, merge with pending question
      if (awaitingLocation) {
        setFarmerLocation(text);
        if (pendingQuestion) {
          // Combine original intent with location for richer answer
          text = `${pendingQuestion}\nUser location: ${text}`;
        }
        setAwaitingLocation(false);
        setPendingQuestion(null);
      }
      // Update context
      updateContextFromUser(text);

      const responseLang = '- Respond in ' + (language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English');
      const locationLine = farmerLocation ? `Farmer location: ${farmerLocation}. Adapt crops, seasons (Kharif/Rabi/Zaid), pests & management to this region.` : 'If location not provided and it is essential for accuracy, politely ask once for state/district.';
      const followUpNeeds = pendingQuestion ? 'The user has now provided missing info (likely location). Provide the complete answer, do NOT ask again.' : '';
      const systemPrompt = [
        'You are Kisanसाथी AI, a focused assistant for Indian farmers.',
        locationLine,
        currentCrop ? `Current crop of concern: ${currentCrop}. Provide stage-appropriate guidance if stage implied.` : '',
        currentDisease ? `Current disease of concern: ${currentDisease}. Provide integrated management (cultural, biological, safe chemical options with PHI, resistance management).` : '',
        'You ONLY answer questions about crops, crop diseases, market prices, government schemes, and farming practices.',
        'If the user gives location later, integrate it and answer fully without repeating the request.',
        'RESPONSE RULES:',
        '- Start directly with the answer (no greeting unless first ever message).',
        '- Provide actionable, location-aware recommendations when location is known.',
        '- Use concise bullet points ( • ) for lists (seed rate, spacing, fertilizer schedule, pest control).',
        '- Highlight critical tips with a leading *Important:*',
        '- Ask at most ONE clarifying question only if absolutely required.',
        '- Prefer specific numbers (e.g., spacing 20-25 cm, N:P:K ratios) where typical.',
        '- Keep language simple and farmer-friendly.',
        responseLang,
        followUpNeeds,
        "Do NOT repeat generic disclaimers like 'it depends' without also giving best concrete recommendations.",
        "Never ask for location again if it's already provided.",
        'Be helpful, clear, and friendly.'
      ].join('\n');

      // Pass the system prompt to AI service
      // Detect if last AI message requested location details
      const lastAiMessage = [...updatedMessages].reverse().find(m => m.sender === 'ai');
      const aiAskedLocation = !!lastAiMessage && /your location|state and district|tell me your location/i.test(lastAiMessage.text);

      // Enrich location-only replies with agricultural context before sending to AI
      let enrichedText = text;
      if (aiAskedLocation) {
        // If user provided a known location, append guidance for more targeted advice
        if (/mumbai/i.test(text)) {
          enrichedText = `${text} (Konkan coastal region, humid tropical, lateritic/loamy soil). Provide seasonal crop recommendations (Kharif, Rabi, Zaid) with top 5 suitable crops (e.g., rice (early medium duration), finger millet (nachni), pulses (urad/moong), vegetables (okra, brinjal, chilli), horticulture (coconut, banana, mango). Include soil prep, spacing, expected yield ranges, key pests & diseases (blast, stem borer, fruit borer) and integrated management, irrigation schedule guidance, and local market selling tips.`;
        } else if (/maharashtra/i.test(text)) {
          enrichedText = `${text}. Provide region-specific crop plan for Maharashtra with seasonal breakdown, major cash crops, input optimization, and risk mitigation.`;
        }
      }

      // Basic client-side off-topic gate (after enrichment)
      if (isOffTopic(enrichedText, aiAskedLocation)) {
        const warn: Message = {
          id: Date.now().toString(),
          text: language === 'hi'
            ? 'कृपया खेती, फसल, मौसम, बाजार भाव या सरकारी योजनाओं से संबंधित प्रश्न पूछें।'
            : language === 'mr'
              ? 'कृपया शेती, पिके, हवामान, बाजारभाव किंवा सरकारी योजनांशी संबंधित प्रश्न विचारा.'
              : 'Please ask about farming, crops, weather, market prices or government schemes.',
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => prev.filter(msg => !msg.isTyping).concat(warn));
        return;
      }
      const response = await aiService.getChatResponse(enrichedText, language, systemPrompt);
      const { formatted: formattedResponse, truncated, topicHint } = formatResponse(response, raw);

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: formattedResponse,
        sender: 'ai',
        timestamp: new Date(),
        truncated,
        topicHint
      };

      setMessages(prev => prev.filter(msg => !msg.isTyping).concat(aiMessage));
      if (truncated) setFullResponses(prev => ({ ...prev, [aiMessage.id]: response }));

      // Save chat messages to database (async, don't block UI)
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Save both user and AI messages
          const userMsg: APIChatMessage = {
            role: 'user',
            content: raw,
            timestamp: new Date()
          };
          const aiMsg: APIChatMessage = {
            role: 'assistant',
            content: formattedResponse,
            timestamp: new Date()
          };

          // Determine topic from first user message or current context
          const topic = currentCrop || currentDisease || raw.split(/[.?!]/)[0].slice(0, 50);

          // Save user message
          await chatHistoryAPI.saveChatMessage({
            sessionId,
            message: userMsg,
            topic
          });

          // Save AI response
          await chatHistoryAPI.saveChatMessage({
            sessionId,
            message: aiMsg,
            topic
          });
        }
      } catch (error) {
        console.error('Failed to save chat history:', error);
        // Continue without blocking - chat still works even if save fails
      }

      // Detect if AI is requesting location so we can merge later
      if (!farmerLocation && /\byour (state|district|location|region)\b|tell me your location/i.test(formattedResponse)) {
        setAwaitingLocation(true);
        if (addUserMessage) setPendingQuestion(raw); // store original user intent
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: language === 'hi'
          ? 'क्षमा करें, कुछ समस्या हुई। दोबारा कोशिश करें।'
          : language === 'mr'
            ? 'माफ करा, काही अडचण आली. पुन्हा प्रयत्न करा.'
            : 'Sorry, something went wrong. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => prev.filter(msg => !msg.isTyping).concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: welcomeMessages[language as keyof typeof welcomeMessages] || welcomeMessages.en,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(
        (transcript: string) => setInputMessage(transcript),
        (error?: string) => { if (error) alert('Voice error: ' + error); }
      );
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
        aria-label="Open Chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  const voiceButtonClass =
    'p-3 rounded-full transition-colors ' +
    (isListening ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200');

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Kisanसाथी AI</h3>
              <p className="text-xs text-green-100">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Clear chat"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
      >
        {messages.map((message) => {
          const messageContainerClass = message.sender === 'user' ? 'flex justify-end' : 'flex justify-start';
          const messageBubbleClass =
            'max-w-[85%] rounded-2xl px-4 py-2 ' +
            (message.sender === 'user'
              ? 'bg-green-600 text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100');
          return (
            <div key={message.id} className={messageContainerClass}>
              <div className={messageBubbleClass}>
                {message.isTyping ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    {message.sender === 'ai' && !message.isTyping && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => reactToMessage(message.id, 'like')}
                            className={
                              'p-1 rounded hover:bg-gray-100 transition-colors ' +
                              (message.reactions === 'like' ? 'text-green-600' : 'text-gray-400')
                            }
                            title="Good response"
                          >
                            <ThumbsUp size={12} />
                          </button>
                          <button
                            onClick={() => reactToMessage(message.id, 'dislike')}
                            className={
                              'p-1 rounded hover:bg-gray-100 transition-colors ' +
                              (message.reactions === 'dislike' ? 'text-red-600' : 'text-gray-400')
                            }
                            title="Poor response"
                          >
                            <ThumbsDown size={12} />
                          </button>
                          <button
                            onClick={() => copyToClipboard(message.text)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400"
                            title="Copy"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={() => speak(message.text)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400"
                            title="Read aloud"
                          >
                            {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                          </button>
                          {message.truncated && (
                            <button
                              onClick={() => {
                                const full = fullResponses[message.id];
                                if (full) {
                                  // Request deeper expansion rather than just dumping full (prompts model for richer detail)
                                  setInputMessage(`Provide full detailed expansion for: ${message.topicHint || 'previous answer'}. Include seed rate, spacing, soil preparation, nutrient schedule, pest & disease IPM, irrigation timing, expected yields.`);
                                  setShowSuggestions(false);
                                }
                              }}
                              className="p-1 rounded hover:bg-gray-100 transition-colors text-blue-500 text-xs"
                              title="Get more details"
                            >
                              More
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Quick Suggestions */}
        {showSuggestions && messages.length <= 1 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">Quick suggestions:</p>
            <div className="grid grid-cols-1 gap-2">
              {quickSuggestions[language as keyof typeof quickSuggestions]?.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t('chatPlaceholder') || "Ask about farming..."}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
          </div>
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={voiceButtonClass}
            disabled={isLoading}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white p-3 rounded-full transition-colors"
            title="Send message"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
