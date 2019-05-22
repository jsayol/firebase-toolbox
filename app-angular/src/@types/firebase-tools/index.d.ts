/// <reference types="node" />

interface OptionsWithoutParent {
  project?: string;
  debug?: boolean;
  json?: boolean;
  token?: string;
  nonInteractive?: boolean;
  interactive?: boolean;
  cwd?: string;
}

interface Options extends OptionsWithoutParent {
  parent?: OptionsWithoutParent;
}

declare module 'firebase-tools' {
  import * as commander from 'commander';
  import * as winston from 'winston';

  export const cli: commander.CommanderStatic;
  export const logger: winston.Logger;

  export function errorOut(error: Error, status: string): void;
  export function getCommand(name: string): commander.Command | null;

  export const login: LoginCommands;
  export const auth: AuthCommands;
  export const database: DatabaseCommands;
  export const emulators: EmulatorsCommands;
  export const experimental: ExperimentalCommands;
  export const firestore: FirestoreCommands;
  export const functions: FunctionsCommands;
  export const hosting: HostingCommands;
  export const setup: SetupCommands;
  export const target: TargetCommands;
  export const tools: ToolsCommands;

  export const deploy: (
    options?: DeployOptions
  ) => Promise<{ hosting: string }>;
  export const help: (name: string) => Promise<void>;
  export const init: (
    feature?: InitFeatureName,
    options?: Options
  ) => Promise<void>;
  export const list: (options?: Options) => Promise<FirebaseProject[]>;
  export const logout: (options?: Options) => Promise<void>;
  export const open: (linkName: string, options?: Options) => Promise<string>;
  export const serve: (options?: ServeOptions) => Promise<void>;
  export const use: (newActive: string, options?: UseOptions) => Promise<void>;

  export type InitFeatureName =
    | 'database'
    | 'firestore'
    | 'functions'
    | 'hosting'
    | 'storage';

  export interface FirebaseProject {
    name: string;
    id: string;
    permission: 'own' | 'edit' | 'view';
    instance: string;
  }

  export interface AccountInfo {
    user: AccountUser;
    tokens: AccountTokens;
  }

  export interface AccountUser {
    iss: string;
    azp: string;
    aud: string;
    sub: string;
    email: string;
    email_verified: boolean;
    at_hash: string;
    iat: number;
    exp: number;
  }

  export interface AccountTokens {
    expires_at: number;
    refresh_token: string;
    scopes: string[];
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    id_token: string;
  }

  // No idea why login() returns this instead of the user object...
  export interface LoginAuthMethods {
    login: Function;
    getAccessToken: Function;
    logout: Function;
  }

  export interface LoginCommands {
    (options?: LoginOptions): Promise<AccountUser | LoginAuthMethods>;
    ci: (options?: LoginCiOptions) => Promise<AccountInfo>;
  }

  export interface LoginOptions extends Options {
    localhost?: boolean;
    reauth?: boolean;
    collectUsage?: 'yes' | 'no';
  }

  export interface LoginCiOptions extends Options {
    noLocalhost?: boolean;
  }

  export interface AuthCommands {
    export: (
      dataFile: string,
      options?: AuthExportOptions
    ) => AuthExportOptions | Promise<void>;
    upload: (
      dataFile: string,
      options?: AuthImportOptions
    ) => AuthImportOptions | Promise<(AuthImportUser | { error: string })[][]>;
  }

  export interface AuthExportOptions extends Options {
    format?: 'json' | 'csv';
  }

  export interface AuthImportOptions extends Options {
    hashAlgo?:
      | 'HMAC_SHA512'
      | 'HMAC_SHA256'
      | 'HMAC_SHA1'
      | 'HMAC_MD5'
      | 'MD5'
      | 'SHA1'
      | 'SHA256'
      | 'SHA512'
      | 'PBKDF_SHA1'
      | 'PBKDF2_SHA256'
      | 'SCRYPT'
      | 'BCRYPT'
      | 'STANDARD_SCRYPT';
    rounds?: number;
    memCost?: number;
    saltSeparator?: string;
    parallelization?: number;
    blockSize?: number;
    dkLen?: number;
    hashKey?: string;
    hashInputOrder?: 'SALT_FIRST' | 'PASSWORD_FIRST';
  }

  // TODO: this could probably use some work
  export interface AuthImportUser {
    localId: string;
    email: string;
    emailVerified: boolean;
    passwordHash: string;
    salt: string;
    displayName: string;
    photoUrl: string;
    createdAt: any;
    lastLoginAt: any;
    phoneNumber: any;
    providerUserInfo: any[];
    [other: string]: any;
  }

  export interface DatabaseCommands {
    get: (path: string, options?: DatabaseGetOptions) => Promise<void>;
    set: (
      path: string,
      infile: string | undefined,
      options?: DatabaseSetOptions
    ) => Promise<void>;
    profile: (options?: DatabaseProfileOptions) => Promise<any>;
    push: (
      path: string,
      infile: string | undefined,
      options?: DatabasePushOptions
    ) => Promise<void>;
    remove: (path: string, options?: DatabaseRemoveOptions) => Promise<void>;
    settings: {
      get: (
        path: string,
        options?: DatabaseSettingsGetOptions
      ) => Promise<void>;
      set: (
        path: string,
        value: 'small' | 'medium' | 'large' | 'unlimited',
        options?: DatabaseSettingsSetOptions
      ) => Promise<void>;
    };
    update: (
      path: string,
      infile?: string,
      options?: DatabaseUpdateOptions
    ) => Promise<void>;
    instances: {
      create: (
        instanceName: string,
        options?: Options
      ) => Promise<DatabaseInstance>;
      list: (options?: Options) => Promise<DatabaseInstance[]>;
    };
  }

  export interface DatabaseGetOptions extends Options {
    instance?: string;
    shallow?: boolean;
    pretty?: boolean;
    export?: boolean;
    orderBy?: string;
    orderByKey?: boolean;
    orderByValue?: boolean;
    output?: string;
    limitToFirst?: number;
    limitToLast?: number;
    startAt?: number;
    endAt?: number;
    equalTo?: number;
  }

  export interface DatabaseSetOptions extends Options {
    instance?: string;
    confirm?: boolean;
    data?: string;
  }

  export interface DatabaseProfileOptions extends Options {
    input?: string;
    output?: string;
    duration?: number;
    raw?: boolean;
    noCollapse?: boolean;
    instance?: string;
  }

  export interface DatabasePushOptions extends Options {
    instance?: string;
    data?: string;
  }
  export interface DatabaseRemoveOptions extends Options {
    instance?: string;
    confirm?: boolean;
  }

  export interface DatabaseUpdateOptions extends Options {
    instance?: string;
    confirm?: boolean;
    data?: string;
  }

  export interface DatabaseSettingsGetOptions extends Options {
    instance?: string;
  }

  export interface DatabaseSettingsSetOptions extends Options {
    instance?: string;
  }

  export interface DatabaseInstance {
    instance: string;
    projectNumber: string;
    type: 'DEFAULT_REALTIME_DATABASE' | 'USER_REALTIME_DATABASE';
  }

  export interface EmulatorsCommands {
    start: (options?: EmulatorsStartOptions) => Promise<void>;
    exec: (script: string, options?: EmulatorsExecOptions) => Promise<void>;
  }

  export interface EmulatorsStartOptions extends Options {
    only?: string;
  }

  export interface EmulatorsExecOptions extends Options {
    only?: string;
  }

  export interface ExperimentalCommands {
    functions: {
      shell: (options?: FunctionsShellOptions) => Promise<void>;
    };
  }

  export interface FunctionsShellOptions extends Options {
    port?: number;
  }

  export interface FunctionsCommands {
    config: {
      clone: (options: FunctionsConfigCloneOptions) => Promise<void>;
      get: (path: string, options?: Options) => Promise<{ [k: string]: any }>;
      set: (args: string[], options?: Options) => Promise<void>;
      unset: (args: string[], options?: Options) => Promise<void>;
    };
    delete: (
      filters: string[],
      options?: FunctionsDeleteOptions
    ) => Promise<void>;
    log: (options?: FunctionsLogOptions) => Promise<any[]>;
    shell: (options?: FunctionsShellOptions) => Promise<void>;
  }

  export interface FunctionsConfigCloneOptions extends Options {
    from: string;
    only?: string;
    except?: string;
  }

  export interface FunctionsDeleteOptions extends Options {
    region?: string;
    force?: boolean;
  }

  export interface FunctionsLogOptions extends Options {
    only?: string;
    lines?: number;
    open?: boolean;
  }

  export interface FirestoreCommands {
    delete: (
      path: string,
      options?: FirestoreDeleteOptions
    ) => Promise<void | void[]>;
    indexes: (
      options?: FirestoreIndexesOptions
    ) => Promise<{ indexes: any[]; fieldOverrides: any[] }>; // TODO: improve?
  }

  export interface FirestoreDeleteOptions extends Options {
    recursive?: boolean;
    shallow?: boolean;
    allCollections?: boolean;
    yes?: boolean;
  }

  export interface FirestoreIndexesOptions extends Options {
    pretty?: boolean;
  }

  export interface HostingCommands {
    disable: (options?: HostingDisableOptions) => Promise<void>;
  }

  export interface HostingDisableOptions extends Options {
    confirm?: boolean;
  }

  export interface SetupCommands {
    emulators: {
      database: () => Promise<void>;
      firestore: () => Promise<void>;
    };
  }

  export interface TargetCommands {
    apply: (
      type: string,
      name: string,
      resources: string[],
      options?: TargetApplyOptions
    ) => void | Promise<never>;
    clear: (type: string, name: string, options?: Options) => Promise<boolean>;
    remove: (
      type: string,
      resource: string,
      options?: Options
    ) => Promise<string>;
  }

  export interface TargetApplyOptions extends Options {
    pretty?: boolean;
  }

  export interface ToolsCommands {
    migrate: (options?: ToolsMigrateOptions) => Promise<boolean | void>;
  }

  export interface ToolsMigrateOptions extends Options {
    confirm?: boolean;
  }

  export interface DeployOptions extends Options {
    public?: string;
    message?: string;
    force?: boolean;
    only?: string;
    except?: string;
  }

  export interface ServeOptions extends Options {
    port?: number;
    host?: string;
    only?: string;
    except?: string;
  }

  export interface UseOptions extends Options {
    add?: boolean;
    alias?: string;
    unalias?: string;
    clear?: boolean;
  }
}
