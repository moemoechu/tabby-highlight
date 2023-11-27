# Tabby Highlight Plugin

Tabby terminal keyword highlight plugin based on Xterm control sequence.

## Features

### Highlight Method

- [x] Highlight keyword based on Xterm control sequence.
- [ ] Highlight keyword based on xterm.js decorator.

### Highlight Parameter

- [x] Support highlight background and foreground color.
- [x] Support background and foreground highlight switch separately.
- [x] Support more style (bold, italic, underline).
- [ ] Support true color.

### Advanced Feature

- [x] RegExp keywords ready.
- [x] RegExp verification.
- [ ] Select the specified RegExp match group.
- [ ] Programable(javascript) keyword match.
- [x] Priority adjustment.
- [x] Per keyword case sensitive switch.
- [ ] Profile import and export.
- [x] Compatible with white themes.

### Others

- [x] Settings UI support English and Chinese.
- [x] Tested on Windows and MacOS with Tabby version 1.0.205.

## Usage

### Install

To install, use Tabby builtin plugin manager.

### Reorder

Drag the ON switch will make the keyword draggable.

### Priority

Keyword on top get high priority.

### Warning

**Currently the RegExp is not doing verification at setting, invalid RegExp will cause error in DevTools.**

## Screenshot

### Settings UI

![Settings1](screenshots/settings1.png)
![Settings2](screenshots/settings2.png)

### Running

![Terminal1](screenshots/terminal1.png)

![Terminal2](screenshots/terminal2.png)

### Regexp Verify

![Alt text](screenshots/regexp_verify.png)

## Changelog

- 1.2.5: Refactor match method, now the highlight will work well even if set a keyword regexp **.**(single dot).
- 1.2.4: Compatible with white themes.
- 1.2.3: Support per keyword case sensitive switch.
- 1.2.2: Refactor style setting UI.
- 1.2.1: Support more style (bold, italic, underline).
- 1.2.0: Support Regexp verify.
- 1.1.0: Refactor highlight method, fix nest keyword match, possible downgrade performance(> <).
- 1.0.8: Support keywords priority adjustment.
- 1.0.7: Support background and foreground highlight switch separately.
- 1.0.6: Add error logs.
- 1.0.5: Support case sensitive switch.
- 1.0.4: Small improvements.
- 1.0.3: Fix bugs.
- 1.0.2: Add RegExp support.
- 1.0.1: Add foreground support.
- 1.0.0: Initial version.
