import { createContext, useState, ReactNode, useCallback, useRef } from 'react';

export interface VoiceContextType {
  isVoiceEnabled: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentLanguage: 'hi-IN' | 'mr-IN' | 'en-IN';
  toggleVoice: () => void;
  setLanguage: (lang: 'hi-IN' | 'mr-IN' | 'en-IN') => void;
  startListening: (onResult: (transcript: string) => void, onError?: (error: string) => void) => void;
  stopListening: () => void;
  speak: (text: string, language?: 'hi-IN' | 'mr-IN' | 'en-IN') => Promise<void>;
  stopSpeaking: () => void;
}

export const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'hi-IN' | 'mr-IN' | 'en-IN'>('hi-IN');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const toggleVoice = useCallback(() => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);
    if (!newState) {
      stopListening();
      stopSpeaking();
    }
  }, [isVoiceEnabled, stopListening, stopSpeaking]);

  const setLanguage = useCallback((lang: 'hi-IN' | 'mr-IN' | 'en-IN') => {
    setCurrentLanguage(lang);
  }, []);

  const speak = useCallback(async (text: string, language?: 'hi-IN' | 'mr-IN' | 'en-IN'): Promise<void> => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;
        
        const targetLang = language || currentLanguage;
        utterance.lang = targetLang;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        setIsSpeaking(true);
        
        utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
          resolve();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
        
        setTimeout(() => {
          if (utteranceRef.current) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            utteranceRef.current = null;
            resolve();
          }
        }, 15000);
        
      } catch (error) {
        console.error('Speech synthesis error:', error);
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      }
    });
  }, [isVoiceEnabled, currentLanguage]);

  const startListening = useCallback((
    onResult: (transcript: string) => void, 
    onError?: (error: string) => void
  ) => {
    if (!isVoiceEnabled || typeof window === 'undefined') {
      onError?.('Voice not supported');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        onError?.('Speech recognition not supported');
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentLanguage;
      recognition.maxAlternatives = 1;
      
      setIsListening(true);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        try {
          if (event.results && event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
          }
        } catch (err) {
          console.error('Recognition result error:', err);
          onError?.('Failed to process speech result');
        }
        setIsListening(false);
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        onError?.(event.error || 'Speech recognition failed');
      };
      
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      
      recognition.start();
      
      timeoutRef.current = setTimeout(() => {
        stopListening();
        onError?.('Speech recognition timeout');
      }, 10000);
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      onError?.('Failed to start speech recognition');
    }
  }, [isVoiceEnabled, currentLanguage, stopListening]);

  const value: VoiceContextType = {
    isVoiceEnabled,
    isListening,
    isSpeaking,
    currentLanguage,
    toggleVoice,
    setLanguage,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}
