const REMOTION_KNOWLEDGE = `
# REMOTION VIDEO EDITING FRAMEWORK KNOWLEDGE

## Core Concepts:
- **Frame-based timing**: Everything measured in frames, not seconds
- **Compositions**: Videos defined by width, height, fps, and durationInFrames
- **React-based**: Videos are React components that change over time
- **useCurrentFrame()**: Hook to get current frame number (0-based)
- **30fps = 30 frames per second**: Common frame rates are 24, 30, 60

## Timeline Structure:
- **Tracks**: Horizontal layers, higher tracks render on top
- **Clips**: Individual media elements with start time and duration
- **Effects**: Animations and transitions applied to clips
- **Layering**: Track order determines visual layering (track-1 = bottom, track-2 = on top)

## Timing Calculations:
- 1 second = fps frames (e.g., 30fps: 1 second = 30 frames)
- 5 seconds = 150 frames (at 30fps)
- Frame 0 = start of video
- Frame durationInFrames-1 = last frame

## Common Effects:
- **fade-in**: Opacity 0→1 over specified frames
- **fade-out**: Opacity 1→0 over specified frames
- **slide-in**: Element moves from off-screen position
- **Transitions**: Between clips or scenes

## Text Styling:
- CSS-in-JS format: {fontFamily, fontSize, color, fontWeight}
- Colors in hex format: "#FFFFFF", "#000000", "#FF0000"
- Font sizes in pixels: 48, 64, 80, 100
- Standard fonts: "Arial, sans-serif", "Helvetica, sans-serif"

## Video Clip Properties:
- assetUrl: URL to video file
- startInFrames: When clip begins on timeline
- durationInFrames: How long clip lasts
- effects: Array of animations/transitions

## Best Practices:
- Use reasonable defaults for timing (2-3 seconds for text)
- Layer text above video clips
- Add subtle effects for professional look
- Keep timing aligned to frame boundaries
`;

const TIMELINE_EXAMPLES = {
  // Example 1: Adding text overlay
  addTextOverlay: {
    description: "Add text overlay over existing video",
    example: {
      "project": {"width": 1920, "height": 1080, "fps": 30},
      "timeline": [
        {
          "id": "track-1",
          "type": "video",
          "clips": [/* existing video clips */]
        },
        {
          "id": "track-2",
          "type": "text",
          "clips": [
            {
              "id": "text-overlay-1",
              "text": "Welcome",
              "startInFrames": 0,
              "durationInFrames": 90, // 3 seconds at 30fps
              "style": {
                "fontFamily": "Arial, sans-serif",
                "fontSize": 64,
                "fontWeight": "bold",
                "color": "#FFFFFF"
              },
              "effects": [
                {"type": "fade-in", "durationInFrames": 15}
              ]
            }
          ]
        }
      ]
    }
  },

  // Example 2: Changing existing text
  modifyText: {
    description: "Change text content and styling",
    before: {
      "id": "text-clip-1",
      "text": "Hello, Remotion!",
      "style": {"fontSize": 80, "color": "#FFFFFF"}
    },
    after: {
      "id": "text-clip-1",
      "text": "Hello World!",
      "style": {"fontSize": 80, "color": "#FF0000"} // Changed to red
    }
  },

  // Example 3: Adjusting timing
  adjustTiming: {
    description: "Move clip to different time or change duration",
    operations: [
      "Move clip earlier: decrease startInFrames",
      "Move clip later: increase startInFrames",
      "Make longer: increase durationInFrames",
      "Make shorter: decrease durationInFrames"
    ]
  },

  // Example 4: Adding effects
  addEffects: {
    description: "Common effect patterns",
    fadeIn: {"type": "fade-in", "durationInFrames": 30},
    fadeOut: {"type": "fade-out", "durationInFrames": 30},
    slideIn: {"type": "slide-in", "direction": "from-bottom", "durationInFrames": 20}
  }
};

const COMMON_OPERATIONS = {
  // Text modifications
  changeText: "Update the 'text' property of text clips",
  changeTextColor: "Modify style.color property (use hex colors like '#FF0000')",
  changeTextSize: "Modify style.fontSize property (typical values: 48, 64, 80, 100)",

  // Timing modifications
  moveClip: "Adjust startInFrames to change when clip appears",
  resizeClip: "Adjust durationInFrames to change how long clip lasts",

  // Adding new elements
  addText: "Create new text clip in appropriate track",
  addVideo: "Create new video clip with assetUrl",

  // Effects
  addFade: "Add fade-in/fade-out effects to effects array",
  addAnimation: "Add slide-in or other transition effects"
};

module.exports = {
  REMOTION_KNOWLEDGE,
  TIMELINE_EXAMPLES,
  COMMON_OPERATIONS
};