
import React, { createContext, useContext, useState } from 'react';

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

  return (
    <TTSContext.Provider value={{ 
      isSpeaking, 
      setIsSpeaking, 
      audioLevel, 
      setAudioLevel,
      visemeData,
      setVisemeData
    }}>
      {children}
    </TTSContext.Provider>
  );
};
