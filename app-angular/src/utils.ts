import { AbstractControl } from '@angular/forms';
import * as AnsiUp from 'ansi_up';

const ansiUp: AnsiUp.AnsiUp = new (AnsiUp as any).default();
ansiUp.use_classes = true;

export const CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';

export const CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

export function ansiToHTML(text: string): string {
  return ansiUp.ansi_to_html(text);
}

export function getRandomId(): string {
  const ID_LENGTH = 15;

  let id = '';
  do {
    id += Math.random()
      .toString(36)
      .substr(2);
  } while (id.length < ID_LENGTH);

  id = id.substr(0, ID_LENGTH);

  return id;
}

export function contains(obj: { [k: string]: any }, prop: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function ifNotEmpty<T = any>(
  value: T
): Exclude<Exclude<T, ''>, null> | undefined {
  if ((value as any) === '' || value === null) {
    return;
  }

  return value as any;
}

export function databasePathValidator(
  control: AbstractControl
): { [key: string]: any } | null {
  if (typeof control.value === 'string' && control.value.startsWith('/')) {
    return null;
  } else {
    return { path: 'Path must begin with /' };
  }
}

export interface CloudFunctionLogEntry {
  logName: string;
  resource: {
    type: string;
    labels: {
      [k: string]: string;
    };
  };
  timestamp: string;
  receiveTimestamp: string;
  severity: CloudFunctionLogSeverity;
  insertId: string;
  httpRequest: {
    requestMethod: string;
    requestUrl: string;
    requestSize: string;
    status: number;
    responseSize: string;
    userAgent: string;
    remoteIp: string;
    serverIp: string;
    referer: string;
    latency: string;
    cacheLookup: boolean;
    cacheHit: boolean;
    cacheValidatedWithOriginServer: boolean;
    cacheFillBytes: string;
    protocol: string;
  };
  labels: {
    [k: string]: string;
  };
  metadata: {
    systemLabels: {
      [k: string]: any;
    };
    userLabels: {
      [k: string]: string;
    };
  };
  operation: {
    id: string;
    producer: string;
    first: boolean;
    last: boolean;
  };
  trace: string;
  spanId: string;
  traceSampled: boolean;
  sourceLocation: {
    file: string;
    line: string;
    function: string;
  };

  // Union field payload can be only one of the following:
  protoPayload?: {
    '@type': string;
    [k: string]: any;
  };
  textPayload?: string;
  jsonPayload?: {
    [k: string]: any;
  };
  // End of list of possible types for union field payload.
}

export enum CloudFunctionLogSeverity {
  DEFAULT = 'DEFAULT',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  NOTICE = 'NOTICE',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  ALERT = 'ALERT',
  EMERGENCY = 'EMERGENCY'
}
