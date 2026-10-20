# Status Pills

**English** · [Português (Brasil)](README.pt-BR.md)

A row of pills by the Claude Code prompt that shows what the status line shows, in a cleaner look: model, context, usage limits, project and branch, and the prompt cache. In the terminal it sits right under the prompt; in the desktop app's Code tab, right above the text box.

**In the terminal**

![Status Pills in the terminal: model and effort, context, the 5-hour and 7-day limits with their resets, project and branch](images/terminal-example.png)

**In the desktop app**

![Status Pills in the desktop app: the same pills, drawn as shapes in the theme's colors](images/desktop-example.png)

## What the pills show

| Pill | What it tells you | Example |
| --- | --- | --- |
| Model | Model and effort level | `Opus 5.5 xhigh` |
| Context | How much of the context window is used, with a bar | `ctx 24%` |
| 5-hour limit | Usage, with a bar, and the time left until it resets | `5h 8% · 3h09` |
| 7-day limit | Usage, with a bar, and the day/month and hour it resets | `7D 11% · 19/10 21h` |
| Project | Project folder and the git branch the agent works on | `mod-status-pills main` |
| Prompt cache | Minutes until the cache goes cold, and how much of what was sent came from it | `42m 95%` |

The bars are green under 50%, yellow under 80%, and red from there up. In a narrow window the bars shrink first; if the pills still don't fit, they wrap onto a second line, with both lines centered.

The branch follows the agent. When it edits a file in another worktree of the same repository (one it made with `git worktree add` to work beside another session, say), the pill shows that worktree's branch, while the folder stays the session's. It goes back to the session folder's branch when the agent edits a file there again, or once that worktree is removed. Only the main conversation's edits count, not a subagent's.

The cache pill shows up after the first response. Its minutes count down from the latest request to the model, in the same colors by how much of the cache's life has gone; once it runs out the pill says `frio` (cold) in red, and the next message reprocesses the whole conversation. The share counts the main conversation alone, since it started or since the last `/clear`. Claude Code tells a mod how long the cache lasts only when the model switches, so the pill counts an hour until then; switching to another model starts it cold.

## Install

Status Pills installs by its id, `status-pills`, from [WPC Mods for Claude](https://github.com/carreirodev/wpc-mods-claude), the marketplace with all my mods. There are two ways, and they do the same thing: pick one.

**Inside Claude Code**, in a session, type:

```
/plugin install status-pills --marketplace carreirodev/wpc-mods-claude
```

Answer `y` to add the marketplace, then press Enter to pick the user scope (the first in the list). `Installed status-pills` confirms it.

**From a terminal**, outside Claude Code, run one command and then the other:

```
claude plugin marketplace add carreirodev/wpc-mods-claude
```

```
claude plugin install status-pills@wpc-mods-claude
```

Here the user scope is already the default, so there's nothing to pick.

Either way, the pills show up in every new session from then on; in a session that was already open, run `/reload-plugins`.

Installed it earlier from this repository's own marketplace (`status-pills@status-pills`)? That copy keeps updating as before. To switch, follow [these steps](https://github.com/carreirodev/wpc-mods-claude#if-you-already-installed-a-mod-from-its-own-repository); don't keep both, since only one would run.

> [!TIP]
> The terminal icons need a [Nerd Font](https://www.nerdfonts.com/). On WSL or Linux, also check [True color on WSL and Linux](#true-color-on-wsl-and-linux).

## Update

Updates aren't automatic: each computer that installed from the marketplace has to ask for the new version.

1. In a terminal, outside Claude Code, run:

   ```
   claude plugin update status-pills@wpc-mods-claude
   ```

   The reply says which version it moved from and to, e.g. `updated from 0.2.2 to 0.2.3`. If it's already on the latest, it says `already at the latest version`.

2. Open a new Claude Code session, or run `/reload-plugins` in one that's already open. A session left open during the update keeps the old version until then.

Inside a session, `/plugin marketplace update wpc-mods-claude` does the same as step 1.

WSL has its own Claude Code install, separate from the Windows one: run step 1 inside WSL too.

To check the installed version, run `claude plugin list` and look for `status-pills@wpc-mods-claude`.

To stop having to remember: in `/plugin`, on the **Marketplaces** tab, pick `wpc-mods-claude` and then **Enable auto-update**. From then on, each new session fetches the new version by itself and tells you with `Plugin updated: status-pills · Run /reload-plugins to apply`.

## Where the pills sit

### Terminal

The pills sit right under the prompt. Claude Code's hint line stays as it draws it, above the pills, with a blank line between them. Whatever other mods put under the prompt (launchpad's button, for example) stays too, above or below the pills depending on the order the mods load in.

Each pill is one line tall, with a colored background and rounded ends.

### Desktop app

The line under the text box belongs to the app itself (permission mode, model), and it doesn't let mods draw there. So on the desktop the pills go in the band above the text box, always last, right against it. Whatever other mods draw in that band (prompt-enhancer's buttons, for example) stays above the pills.

The pills are drawn as shapes, in the light or dark theme's colors.

### Load order

Where the pills land depends on the order Claude Code loads mods in, which a mod doesn't get to choose. Mods loaded from a folder (`--plugin-dir` or `CLAUDE_CODE_PLUGIN_DIRS`, as in [Developing](#developing)) come before the ones installed from a marketplace. Coming first, Status Pills receives the other mods' band already built and places itself under it.

Installed from the marketplace, it waits in line with the other installed mods, in whatever order Claude Code decides. A mod that comes before it and draws the band on its own, without letting the ones below draw, hides the pills on the desktop (prompt-enhancer 0.2.0 does this).

## True color on WSL and Linux

On WSL and Linux, Claude Code only uses true color when the terminal announces it. Check with `echo $COLORTERM`: if it doesn't print `truecolor`, colors are reduced to a 256-color palette, and the icons and bars lose their exact shade.

If your terminal does draw true color, as Windows Terminal does, add `export COLORTERM=truecolor` to `~/.bashrc` (or `~/.zshrc`) and open a new terminal before starting Claude Code.

## Developing

To work on the mod, use a cloned folder instead of the install above (one or the other, not both):

1. Clone the repository:

   ```
   git clone https://github.com/carreirodev/mod-status-pills.git C:\Users\YOUR_USER\mods\status-pills
   ```

2. In `~/.claude/settings.json`, inside the `env` block, add that folder to `CLAUDE_CODE_PLUGIN_DIRS`. On Windows, separate several folders with `;`:

   ```json
   "env": {
     "CLAUDE_CODE_PLUGIN_DIRS": "C:\\Users\\YOUR_USER\\mods\\agents-panel;C:\\Users\\YOUR_USER\\mods\\status-pills"
   }
   ```

3. Open a new session. From then on, every change saved in the folder reloads the mod at the end of Claude's reply.

Before pushing a change, run in the mod's folder:

```
claude plugin validate .
claude plugin test .
```

Then bump `version` in `.claude-plugin/plugin.json`: computers that installed from the marketplace only get the change when the version changes.
