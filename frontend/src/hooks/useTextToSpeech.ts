import { useCallback, useEffect } from 'react';

const useTextToSpeech = () => {
  // Preload voices on mount
  useEffect(() => {
    // Force load voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      
      // Some browsers need this event to load voices
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const speak = useCallback((text: string, lang: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9; // Slightly slower for language learning
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Get available voices and prioritize Google male voice
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Priority order for voice selection
        const voicePreferences = [
          // Google voices (male)
          (voice: SpeechSynthesisVoice) => voice.name.includes('Google') && voice.name.includes('Male'),
          (voice: SpeechSynthesisVoice) => voice.name.includes('Google US English Male'),
          (voice: SpeechSynthesisVoice) => voice.name.includes('Google') && voice.lang === lang && !voice.name.includes('Female'),
          // Any Google English voice
          (voice: SpeechSynthesisVoice) => voice.name.includes('Google') && voice.lang.startsWith(lang.split('-')[0]),
          // Microsoft male voices
          (voice: SpeechSynthesisVoice) => voice.name.includes('Microsoft') && voice.name.includes('Male') && voice.lang === lang,
          // Any male voice
          (voice: SpeechSynthesisVoice) => voice.name.includes('Male') && voice.lang === lang,
          // Fallback to any voice matching the language
          (voice: SpeechSynthesisVoice) => voice.lang === lang,
          // Final fallback to any voice starting with the language code
          (voice: SpeechSynthesisVoice) => voice.lang.startsWith(lang.split('-')[0])
        ];
        
        // Try each preference in order
        for (const preference of voicePreferences) {
          const preferredVoice = voices.find(preference);
          if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log('Selected voice:', preferredVoice.name);
            break;
          }
        }
      };
      
      // Set voice immediately if available, or wait for voices to load
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoice();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoice();
          // Remove the handler after setting voice
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech not supported in this browser');
    }
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
};

export default useTextToSpeech;