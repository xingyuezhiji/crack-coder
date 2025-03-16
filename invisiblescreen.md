# Window Invisibility Implementation Specification

## Overview
This document details how the application achieves window invisibility to screen capture software while remaining visible to users.

## Technical Implementation

### Core Window Properties
The window is initialized with specific Electron BrowserWindow properties that form the foundation of the invisibility mechanism:

```typescript
{
    frame: false,           // Removes window chrome/frame
    transparent: true,      // Enables window transparency
    backgroundColor: "#00000000",  // Fully transparent background
    hasShadow: false,      // Removes window shadows
    alwaysOnTop: true      // Keeps window above others
}
```

### Screen Capture Protection

#### Primary Protection Mechanism
The core invisibility is achieved through Electron's content protection API:
```typescript
window.setContentProtection(true)
```
This flags the window content as protected, preventing it from being included in:
- Screen recording software
- System screenshots
- Screen sharing applications
- Third-party capture tools

#### Platform-Specific Enhancements (macOS)
Additional protection layers for macOS:
```typescript
window.setHiddenInMissionControl(true)
window.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
})
window.setAlwaysOnTop(true, "floating")
```

### Security Characteristics
1. **User Visibility**: Remains fully visible to the end user
2. **Capture Protection**: Content is excluded from:
   - Screen recording applications
   - Video conferencing tools
   - Screenshot utilities
   - System screen capture features

### Technical Limitations
1. Hardware-level capture might still be possible
2. Protection effectiveness may vary by operating system
3. Some anti-cheat or security software might interfere with the protection

### Implementation Notes
- The window must maintain these properties throughout its lifecycle
- Any changes to transparency or frame settings might affect the protection
- Content protection should be enabled before loading any sensitive content

## Usage Considerations
- Suitable for displaying sensitive information
- Ideal for overlay-style applications
- Useful for preventing unauthorized content capture
- Should be used responsibly and in compliance with platform guidelines
