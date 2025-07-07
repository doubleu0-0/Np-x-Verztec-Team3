import React, { createContext, useContext, useState, useCallback } from 'react';

const TTSContext = createContext();

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};

export const TTSProvider = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [visemeData, setVisemeData] = useState({
    mouthOpen: 0,
    mouthWide: 0,
    lipsPursed: 0,
    smile: 0.15,
    volume: 0,
    jawOpen: 0,
    naturalVariation: 0
  });

  // Function to speak text and update avatar state
  const speakText = useCallback((text) => {
    if (!text || text.trim().length === 0) return;

    // Stop any current speech
    speechSynthesis.cancel();

    const speakWithFemaleVoice = () => {
      const voices = speechSynthesis.getVoices();
      
      // Trim at "📄"
      const trimmedContent = text.split("📄")[0];
      if (trimmedContent.trim().length === 0) return;
      
      // Try to find a female-sounding English voice
      const femaleVoice = voices.find(
        (v) =>
          v.lang === 'en-US' &&
          (v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('zira') || // Windows
          v.name.toLowerCase().includes('samantha') || // macOS
          v.name.toLowerCase().includes('google us english')) // Chrome
      ) || voices.find(v => v.lang === 'en-US'); // fallback

      const utterance = new SpeechSynthesisUtterance(trimmedContent);
      utterance.voice = femaleVoice;
      utterance.lang = 'en-US';
      utterance.pitch = 1;
      utterance.rate = 1;

      // Set up event listeners to update avatar state
      utterance.onstart = () => {
        setIsSpeaking(true);
        // Start mouth movement animation
        const stopAnimation = animateMouth();
        
        // Store the stop function to clean up later
        utterance.stopAnimation = stopAnimation;
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // Stop animation and reset mouth to neutral position
        if (utterance.stopAnimation) {
          utterance.stopAnimation();
        }
        setVisemeData({
          mouthOpen: 0,
          mouthWide: 0,
          lipsPursed: 0,
          smile: 0.15,
          volume: 0,
          jawOpen: 0,
          naturalVariation: 0
        });
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        // Stop animation and reset on error
        if (utterance.stopAnimation) {
          utterance.stopAnimation();
        }
        setVisemeData({
          mouthOpen: 0,
          mouthWide: 0,
          lipsPursed: 0,
          smile: 0.15,
          volume: 0,
          jawOpen: 0,
          naturalVariation: 0
        });
      };

      speechSynthesis.speak(utterance);
    };

    // Handle case when voices might not be ready yet
    if (speechSynthesis.getVoices().length) {
      speakWithFemaleVoice();
    } else {
      speechSynthesis.onvoiceschanged = () => {
        speakWithFemaleVoice();
      };
    }
  }, []);

  // Natural mouth animation function
  const animateMouth = useCallback(() => {
    let animationId;
    let startTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;
      
      // Fast-changing mouth movements for natural speech
      const fastTime = elapsed * 12;;
      const mediumTime = elapsed * 4;
      const slowTime = elapsed * 2;
      
      // Create natural mouth opening/closing pattern
      const baseMouthOpen = 0.2 + Math.sin(fastTime) * 0.15;
      const mouthOpen = Math.max(0.05, Math.min(0.5, baseMouthOpen));
      
      // Jaw movement that's slightly slower than mouth
      const jawOpen = 0.05 + Math.sin(mediumTime) * 0.04;
      
      // Occasional mouth width changes for consonants
      const mouthWide = 0.05 + Math.sin(slowTime) * 0.03;
      
      setVisemeData({
        mouthOpen: Math.max(0, Math.min(1, mouthOpen)),
        mouthWide: Math.max(0, Math.min(1, mouthWide)),
        lipsPursed: 0,
        smile: 0.15,
        volume: 0.5,
        jawOpen: Math.max(0, Math.min(1, jawOpen)),
        naturalVariation: 0
      });
      
      // Continue animation
      animationId = requestAnimationFrame(animate);
    };
    
    const startAnimation = () => {
      startTime = Date.now();
      animate();
    };
    
    startAnimation();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isSpeaking]);

  return (
    <TTSContext.Provider value={{ 
      isSpeaking, 
      setIsSpeaking, 
      audioLevel, 
      setAudioLevel,
      visemeData,
      setVisemeData,
      speakText // Add this function to the context
    }}>
      {children}
    </TTSContext.Provider>
  );
};