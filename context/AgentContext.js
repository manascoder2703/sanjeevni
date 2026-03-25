'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const AgentContext = createContext();

export function AgentProvider({ children }) {
  const [isAgentVisible, setIsAgentVisible] = useState(false);

  const toggleAgent = useCallback(() => {
    setIsAgentVisible(prev => !prev);
  }, []);

  const showAgent = useCallback(() => {
    setIsAgentVisible(true);
  }, []);

  const hideAgent = useCallback(() => {
    setIsAgentVisible(false);
  }, []);

  return (
    <AgentContext.Provider value={{ 
      isAgentVisible, 
      toggleAgent, 
      showAgent, 
      hideAgent 
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
