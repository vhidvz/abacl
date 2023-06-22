import { debug } from 'debug';

export const log = (namespace: string, prefix = 'abacl') => {
  const logger = debug(`${prefix}:${namespace}`);

  return {
    error: (formatter: string, ...args: unknown[]) => logger(`\x1b[31m${'[ERROR]'} ` + formatter, ...args, '\x1b[0m'),
    warn: (formatter: string, ...args: unknown[]) => logger(`\x1b[33m${'[WARNING]'} ` + formatter, ...args, '\x1b[0m'),
    info: (formatter: string, ...args: unknown[]) => logger(`\x1b[34m${'[INFO]'} ` + formatter, ...args, '\x1b[0m'),
    debug: (formatter: string, ...args: unknown[]) => logger(`\x1b[36m${'[DEBUG]'} ` + formatter, ...args, '\x1b[0m'),
  };
};
