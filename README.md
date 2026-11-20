# Dream Skin Theme Optimizer

A Codex++ extension that adapts the desktop UI to the active Dream Skin without editing the theme package.

## Install

Download the extension ZIP from the repository's Releases page and import it as a local extension in Codex++. The ZIP contains `codexpp.json` and `renderer.js` at its root. Enable the extension, then switch Dream Skin themes as usual.

## What It Changes

- Applies theme-aware colors to outgoing message bubbles, attachment removal controls, keyboard focus, and the Windows application menu bar.
- Shows the native docked sidebar divider by default when the theme does not already draw one. The native resize handle remains usable.
- Uses the conversation backdrop treatment on Home and applies the same docked sidebar and shell corner treatment on both pages in macOS and Windows.
- Reduces overlapping tint when the underlying and overlaid surfaces match.
- Clears the thread footer's white overlay over full-width theme art, adds space to the editor and toolbar, and applies the theme's muted text color to the goal bar.

The extension only applies while Dream Skin is active. Disable it in Codex++ to return to the theme's unmodified appearance. It does not access chat data or make network requests.

Requires Codex++ extension API version 1. Optional Windows menu bar changes are limited to the Windows application-menu layout.

## License

[MIT](LICENSE)
