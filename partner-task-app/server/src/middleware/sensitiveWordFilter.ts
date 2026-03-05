import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In-memory cache for sensitive words
let sensitiveWordsCache: Map<string, number> = new Map();
let lastCacheUpdate = Date.now();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load sensitive words from database
 * Compliance requirement: Content filtering
 */
async function loadSensitiveWords() {
  try {
    const words = await prisma.sensitiveWord.findMany({
      where: { level: { gte: 2 } }, // Level 2: block, Level 3: ban
    });
    
    sensitiveWordsCache.clear();
    words.forEach(word => {
      sensitiveWordsCache.set(word.word.toLowerCase(), word.level);
    });
    lastCacheUpdate = Date.now();
  } catch (error) {
    console.error('Failed to load sensitive words:', error);
  }
}

/**
 * Check if text contains sensitive words
 */
export function containsSensitiveWord(text: string): { found: boolean; word?: string; level?: number } {
  const lowerText = text.toLowerCase();
  
  for (const [word, level] of sensitiveWordsCache.entries()) {
    if (lowerText.includes(word)) {
      return { found: true, word, level };
    }
  }
  
  return { found: false };
}

/**
 * Filter sensitive words from text (replace with *)
 */
export function filterSensitiveWords(text: string): string {
  let filtered = text;
  
  for (const [word] of sensitiveWordsCache.entries()) {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  }
  
  return filtered;
}

// Initialize cache on startup
loadSensitiveWords();
setInterval(loadSensitiveWords, CACHE_TTL);

/**
 * Middleware to check request body for sensitive words
 */
export const sensitiveWordFilter = (req: Request, res: Response, next: NextFunction) => {
  // Refresh cache if needed
  if (Date.now() - lastCacheUpdate > CACHE_TTL) {
    loadSensitiveWords();
  }

  // Only check POST/PUT/PATCH requests with body
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Skip file uploads
  if (req.is('multipart/form-data')) {
    return next();
  }

  // Check body for sensitive words
  if (req.body) {
    const checkObject = (obj: any): { found: boolean; word?: string; level?: number } => {
      if (typeof obj === 'string') {
        return containsSensitiveWord(obj);
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          const result = checkObject(obj[key]);
          if (result.found) return result;
        }
      }
      return { found: false };
    };

    const result = checkObject(req.body);
    
    if (result.found) {
      console.warn(`[SensitiveWord] Blocked: ${result.word} (level: ${result.level})`);
      
      if (result.level === 3) {
        // Level 3: Ban - log and block
        return res.status(403).json({
          error: 'CONTENT_VIOLATION',
          message: '您的内容包含违规词汇，已被拦截。请修改后重新提交。',
          code: 'SENSITIVE_WORD_BANNED',
        });
      } else {
        // Level 2: Block - suggest filtering
        return res.status(400).json({
          error: 'CONTENT_VIOLATION',
          message: '您的内容包含不当词汇，请修改后重新提交。',
          code: 'SENSITIVE_WORD_BLOCKED',
        });
      }
    }
  }

  next();
};

// Export for use in services (already exported above)
// export { loadSensitiveWords, containsSensitiveWord, filterSensitiveWords };
