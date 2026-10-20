// One rate-limit window: how much of it is used, and when it resets
export type Limit = {
  percent: number
  // Milliseconds since the epoch; null when the engine gave no reset time
  resetsAt: number | null
}

// The main loop's prompt cache, as its responses reported it
export type Cache = {
  // Input tokens the main loop's requests carried, and how many of them the cache served
  tokensIn: number
  tokensRead: number
  // When the latest answered request was sent, the moment its cache entry was
  // last refreshed; null before one, and once a model switch forfeited the cache
  sentAt: number | null
  // How long an entry lives unused, in milliseconds
  ttlMs: number
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
      // The main loop's prompt cache; null until a response or a model switch reports on it
      cache: Cache | null
      // The worktree of the session's repository the main loop last edited a
      // file in, as git lists it; null until then
      worktree: string | null
    }
  }
}
