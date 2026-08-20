// ============ Logging Utilities (Browser-Compatible) ============

const getEnv = (key: string): string | undefined => {
  if (typeof (globalThis as any).process !== "undefined" && (globalThis as any).process.env) {
    return (globalThis as any).process.env[key];
  }
  return undefined;
};

export type LogPhase = "ENTER" | "EXIT" | "ERROR";

export type LogCallback = (
  targetName: string,
  methodName: string,
  args: unknown[],
  resultOrError?: unknown,
  phase?: LogPhase,
  traceId?: string
) => void;

export const DEBUG_ENV_VAR = "DEBUG_STARKNET_SDK";

export function isDebugEnabled(): boolean {
  const val = getEnv(DEBUG_ENV_VAR);
  return val === "1" || val === "true" || val === "*";
}

export function debugHint(): string {
  return isDebugEnabled() ? "" : ` (set ${DEBUG_ENV_VAR}=1 for details)`;
}

export function debugLog(message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.log(`[SDK DEBUG] ${message}`, ...args);
  }
}

export const noopLogCallback: LogCallback = () => {};

export const consoleLogCallback: LogCallback = (
  targetName,
  methodName,
  args,
  resultOrError,
  phase = "ENTER",
  traceId
) => {
  const idStr = traceId ? `[${traceId}]` : "";
  if (phase === "ENTER") {
    console.log(`%c${idStr} -> ${targetName}.${methodName}`, "color: #4a9eff", args);
  } else if (phase === "EXIT") {
    console.log(`%c${idStr} <- ${targetName}.${methodName}`, "color: #4ade80", resultOrError);
  } else if (phase === "ERROR") {
    console.error(`${idStr} x- ${targetName}.${methodName}`, resultOrError);
  }
};

export function withLogging<T extends object>(
  target: T,
  _targetName: string,
  _callback: LogCallback = isDebugEnabled() ? consoleLogCallback : noopLogCallback
): T {
  return target;
}
