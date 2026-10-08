// One rate-limit window: how much of it is used, and when it resets
export type Limit = {
  percent: number
  // Milliseconds since the epoch; null when the engine gave no reset time
  resetsAt: number | null
}

// Everything the band draws, read from the session at one moment
export type Snapshot = {
  model: string | null
  // Share of the context window the last response used, 0 to 100
  contextPercent: number | null
  fiveHour: Limit | null
  sevenDay: Limit | null
  project: string | null
  branch: string | null
  // When it was read: the moment the countdowns count from
  at: number
}

declare module 'claude-code' {
  interface PluginState {
    'status-pills': {
      snapshot: Snapshot | null
      // The main loop's effort, as its latest model request named it
      effort: string | null
    }
  }
}
