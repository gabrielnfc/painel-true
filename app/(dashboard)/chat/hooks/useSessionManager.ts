import { v4 as uuidv4 } from 'uuid';

export const useSessionManager = (userId: string) => {
  // Gera um novo sessionId
  const generateSessionId = () => `${userId}-${uuidv4()}`;

  return { generateSessionId };
}; 