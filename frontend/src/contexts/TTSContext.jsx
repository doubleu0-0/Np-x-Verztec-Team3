import React, { createContext, useContext, useState, useCallback } from 'react';

const TTSContext = createContext();

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};

export const TTSProvider = ({ children, selectedAvatar }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [visemeData, setVisemeData] = useState({
    mouthOpen: 0,
    mouthWide: 0,
    lipsPursed: 0,
    smile: 0.15,
    volume: 0,
    jawOpen: 0,
    naturalVariation: 0
  });

  // Function to toggle mute and stop speech immediately
  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted) {
        speechSynthesis.cancel(); // Stop ongoing speech
        setIsSpeaking(false);     // Reset speaking state
      }
      return newMuted;
    });
  };

  const avatarVoiceMap = {
    avatar1: 'Zira',
    avatar2: 'Matthew',
    avatar3: 'David',
    avatar4: 'Daniel', 
    avatar5: 'Zira', 
    avatar6: 'Zira',
  };

  const speakText = useCallback((text) => {
    if (isMuted || !text || text.trim().length === 0) return;

    speechSynthesis.cancel();

    const speakWithVoice = () => {
      const voices = speechSynthesis.getVoices();

      const trimmedContent = text.split("Evaluating")[0];
      if (trimmedContent.trim().length === 0) return;

      const preferredVoiceName = avatarVoiceMap[selectedAvatar];
      const matchedVoice = voices.find(
        (v) => v.name.toLowerCase().includes(preferredVoiceName.toLowerCase())
      );

      const fallbackVoice = voices.find((v) => v.lang === 'en-US');

      const utterance = new SpeechSynthesisUtterance(trimmedContent);
      utterance.voice = matchedVoice || fallbackVoice;
      utterance.lang = 'en-US';
      utterance.pitch = 1;
      utterance.rate = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        const stopAnimation = animateMouth();
        utterance.stopAnimation = stopAnimation;
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (utterance.stopAnimation) utterance.stopAnimation();
        resetViseme();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        if (utterance.stopAnimation) utterance.stopAnimation();
        resetViseme();
      };

      speechSynthesis.speak(utterance);
    };

    if (speechSynthesis.getVoices().length) {
      speakWithVoice();
    } else {
      speechSynthesis.onvoiceschanged = () => {
        speakWithVoice();
      };
    }
  }, [isMuted, selectedAvatar]);  


  // Reset viseme animation
  const resetViseme = () => {
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

  // Natural mouth animation
  const animateMouth = useCallback(() => {
    let animationId;
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;

      const fastTime = elapsed * 12;
      const mediumTime = elapsed * 4;
      const slowTime = elapsed * 2;

      const baseMouthOpen = 0.2 + Math.sin(fastTime) * 0.15;
      const mouthOpen = Math.max(0.05, Math.min(0.5, baseMouthOpen));
      const jawOpen = 0.05 + Math.sin(mediumTime) * 0.04;
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

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <TTSContext.Provider value={{
      isSpeaking,
      setIsSpeaking,
      audioLevel,
      setAudioLevel,
      visemeData,
      setVisemeData,
      speakText,
      isMuted,
      setIsMuted,
      toggleMute // 
    }}>
      {children}
    </TTSContext.Provider>
  );
};
