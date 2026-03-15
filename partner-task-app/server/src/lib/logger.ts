import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : {
        target: 'pino-roll',
        options: {
          file: process.env.LOG_FILE || './logs/app.log',
          frequency: 'daily',
          mkdir: true,
          size: '10M',
          retention: 7,
        },
      },
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// 快捷方法
export const log = logger;
export default logger;
