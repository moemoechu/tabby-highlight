# Tabby Highlight Plugin

Tabby terminal keyword highlight plugin based on Xterm control sequence.

## Features

- [x] Highlight keyword based on Xterm control sequence.
- [ ] Highlight keyword based on xterm.js decorator.
- [x] Support highlight background and foreground color.
- [x] Support background and foreground highlight switch separately.
- [x] RegExp keywords ready.
- [ ] RegExp verification.
- [x] Priority adjustment.
- [ ] Profile import and export.
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

![Settings](screenshots/settings.png)

### Running

![Terminal1](screenshots/terminal1.png)

![Terminal2](screenshots/terminal2.png)

## Changelog

- 1.0.9: Refectory highlight method, fix nest keyword match, possible downgrade performance(> <).
- 1.0.8: Support keywords priority adjustment.
- 1.0.7: Support background and foreground highlight switch separately.
- 1.0.6: Add error logs.
- 1.0.5: Support case sensitive switch.
- 1.0.4: Small improvements.
- 1.0.3: Fix bugs.
- 1.0.2: Add RegExp support.
- 1.0.1: Add foreground support.
- 1.0.0: Initial version.
