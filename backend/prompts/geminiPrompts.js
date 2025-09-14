const { REMOTION_KNOWLEDGE, TIMELINE_EXAMPLES, COMMON_OPERATIONS } = require('./remotionKnowledge');
const { TIMELINE_OPERATIONS, validateTimeline, DEFAULT_PROJECT } = require('./timelineHelpers');

/**
 * Generate comprehensive prompt for Gemini AI with deep Remotion knowledge
 * (LEGACY - use generateSimplifiedPrompt instead)
 */
function generateComplexVideoEditingPrompt(userMessage, currentTimeline, hasVideo = false) {
  const timelineStatus = currentTimeline?.timeline?.length > 0 ? 'has existing content' : 'is empty or minimal';

  return `# AI VIDEO EDITOR - REMOTION SPECIALIST

You are an expert video editor specializing in Remotion framework. You understand frame-based timing, React-based video composition, and professional video editing techniques.

${REMOTION_KNOWLEDGE}

## CURRENT SITUATION:
User Request: "${userMessage}"
Current Timeline: ${timelineStatus}
Timeline Data: ${JSON.stringify(currentTimeline, null, 2)}
${hasVideo ? 'Video file provided for analysis' : 'Text-only editing request'}

## YOUR TASK:
1. **Analyze the user's request** and determine the exact editing operation needed
2. **Modify the timeline directly** - don't ask questions, make smart decisions
3. **Use professional defaults** for timing, styling, and effects
4. **Always return both explanation AND updated timeline JSON**

## RESPONSE FORMAT:
Provide a brief explanation of your changes, followed by the complete updated timeline in a JSON code block:

\`\`\`json
{
  "project": {"width": 1920, "height": 1080, "fps": 30},
  "timeline": [
    // Your modified timeline here
  ]
}
\`\`\`

## EDITING GUIDELINES:

### Text Operations:
- **Change text**: Update existing text clips directly
- **Add text**: Create new text clip with 3-second duration (90 frames at 30fps)
- **Text positioning**: Use appropriate startInFrames for timing
- **Text styling**: Apply professional fonts, sizes, and colors
- **Default text duration**: 90 frames (3 seconds) unless specified

### Timing Best Practices:
- **Text overlays**: Start at frame 0 for opening text, frame 60 for delayed text
- **Fade effects**: Use 15-30 frame fade-in/out for smooth transitions
- **Duration**: 2-3 seconds for readable text, 5+ seconds for complex content

### Track Management:
- **Layer order**: Keep video on lower tracks (track-1), text on higher tracks (track-2+)
- **Track IDs**: Use sequential naming (track-1, track-2, track-3)
- **New tracks**: Create when adding different content types

### Professional Defaults:
- **Text style**: Arial 64px bold white with fade-in
- **Colors**: Use hex codes (#FFFFFF, #000000, #FF0000)
- **Effects**: Subtle fade-in/out for professional appearance
- **Timing**: Align to frame boundaries, use standard durations

## COMMON OPERATIONS EXAMPLES:

### Change Text Example:
User: "Change text to Hello World"
Action: Find existing text clips and update text property

### Add Text Overlay Example:
User: "Add welcome text at beginning"
Action: Create new text clip with text="Welcome", startInFrames=0, duration=90 frames

### Style Changes Example:
User: "Make text red"
Action: Update style.color to "#FF0000" for all text clips

### Timing Adjustments Example:
User: "Make text appear later"
Action: Increase startInFrames value (30 frames = 1 second delay)

## ADVANCED CLIP OPERATIONS:

### Cut/Split Clip Examples:
User: "Cut the video at 30 seconds"
Action: Use cutClip operation to split clip at frame 900 (30 seconds × 30fps)

User: "Split the first text clip in half"
Action: Find first text clip, calculate middle point, use cutClipAt function

### Trim Clip Examples:
User: "Remove first 5 seconds from video"
Action: Use trimClipFromStart to remove 150 frames (5 × 30fps) from beginning

User: "Trim 2 seconds from the end"
Action: Use trimClipFromEnd to remove 60 frames from clip end

User: "Keep only seconds 10-20 of the clip"
Action: Use trimClipRange to extract frames 300-600

### Join/Merge Examples:
User: "Join the first two text clips"
Action: Use joinMultipleClips to combine clips, concatenating text content

User: "Merge video clips with fade transition"
Action: Use mergeWithCrossfade with 1-second crossfade duration

### Advanced Editing Examples:
User: "Remove seconds 15-20 from the middle of the video"
Action: Use removeClipPortion to cut out specific segment

User: "Move the text to appear at 45 seconds"
Action: Use moveClip to reposition clip to frame 1350

User: "Duplicate the title text at the end"
Action: Use duplicateClipAt to copy clip to new timeline position

## IMPORTANT RULES:
1. **Always include complete timeline JSON** in response
2. **Make direct changes** - don't ask for clarification
3. **Use frame-based timing** (not seconds)
4. **Preserve existing content** unless explicitly asked to remove
5. **Add professional effects** (subtle fade-in/out)
6. **Validate timing logic** (startInFrames + durationInFrames)

## EXAMPLE TIMELINE STRUCTURE:
${JSON.stringify(TIMELINE_EXAMPLES.addTextOverlay.example, null, 2)}

Now process the user's request and return the modified timeline with your explanation.`;
}

/**
 * Enhanced prompt for video analysis with multimodal input
 * (LEGACY - use generateSimplifiedPrompt instead)
 */
function generateComplexVideoAnalysisPrompt(userMessage, currentTimeline, videoDescription = '') {
  return `# AI VIDEO EDITOR - VIDEO ANALYSIS MODE

You are analyzing a video file to help with editing. You understand both visual content and timeline modification.

${REMOTION_KNOWLEDGE}

## ANALYSIS CONTEXT:
User Request: "${userMessage}"
Current Timeline: ${JSON.stringify(currentTimeline, null, 2)}
Video Analysis: Use the video content to inform your timeline modifications

## YOUR TASK:
1. **Analyze the video content** for relevant visual/audio cues
2. **Understand user's editing intent** based on the video and request
3. **Create appropriate timeline modifications** based on video analysis
4. **Time edits to match video content** (scene changes, audio cues, etc.)

## SMART VIDEO EDITING:
- **Scene detection**: Place text at natural scene transitions
- **Audio analysis**: Sync text with speech or music beats
- **Visual composition**: Position text to avoid covering important visual elements
- **Timing optimization**: Match editing rhythm to video pace

## RESPONSE FORMAT:
Brief analysis of video content and editing approach, followed by updated timeline:

\`\`\`json
{
  "project": {"width": 1920, "height": 1080, "fps": 30},
  "timeline": [
    // Timeline modified based on video analysis
  ]
}
\`\`\`

Process the video and user request to create intelligent timeline modifications.`;
}

/**
 * Parse timeline from AI response
 */
function parseTimelineFromResponse(responseText) {
  try {
    // Look for JSON code blocks
    const jsonBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    if (jsonBlockMatch) {
      const jsonString = jsonBlockMatch[1].trim();
      const parsed = JSON.parse(jsonString);

      // Validate the parsed timeline
      const errors = validateTimeline(parsed);
      if (errors.length > 0) {
        console.warn('Timeline validation warnings:', errors);
      }

      return parsed;
    }

    // Fallback: Look for inline JSON
    const inlineMatch = responseText.match(/"timeline":\s*({[\s\S]*?})/);
    if (inlineMatch) {
      return JSON.parse(inlineMatch[1]);
    }

    return null;
  } catch (error) {
    console.error('Error parsing timeline from response:', error);
    return null;
  }
}

/**
 * Clean response text by removing JSON blocks
 */
function cleanResponseText(responseText) {
  return responseText
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim();
}

/**
 * Smart operation detection based on user message
 */
function detectEditingOperation(userMessage) {
  const message = userMessage.toLowerCase();

  // Advanced clip operations
  if (message.includes('cut') || message.includes('split')) {
    return 'cutClip';
  }
  if (message.includes('trim') || message.includes('shorten') ||
      (message.includes('remove') && (message.includes('seconds') || message.includes('first') || message.includes('last')))) {
    return 'trimClip';
  }
  if (message.includes('join') || message.includes('merge') || message.includes('combine')) {
    return 'joinClips';
  }
  if (message.includes('duplicate') || message.includes('copy')) {
    return 'duplicateClip';
  }

  // Basic operations
  if (message.includes('change') && message.includes('text')) {
    return 'changeText';
  }
  if (message.includes('add') && (message.includes('text') || message.includes('overlay'))) {
    return 'addText';
  }
  if (message.includes('color') || message.includes('red') || message.includes('blue') || message.includes('green')) {
    return 'changeColor';
  }
  if (message.includes('move') || message.includes('timing') || message.includes('later') || message.includes('earlier')) {
    return 'adjustTiming';
  }
  if (message.includes('remove') || message.includes('delete')) {
    return 'removeElement';
  }

  return 'general';
}

/**
 * Main function to generate appropriate prompt based on context
 * (Now uses simplified prompt by default)
 */
function generatePrompt(userMessage, currentTimeline, hasVideo = false, assets = []) {
  // Ensure timeline has proper structure
  const timeline = currentTimeline || {
    project: DEFAULT_PROJECT,
    timeline: []
  };

  // Use simplified prompt for both video and text cases
  return generateSimplifiedPrompt(userMessage, timeline, hasVideo, assets);
}

/**
 * Simplified prompt using direct TypeScript schemas from frontend
 */
function generateSimplifiedPrompt(userMessage, currentTimeline, hasVideo = false, assets = []) {
  const timelineStatus = currentTimeline?.timeline?.length > 0 ? 'has existing content' : 'is empty';
  const assetsStatus = assets && assets.length > 0 ? `${assets.length} available` : 'none available';

  return `# AI Video Editor

You are a video editor AI. Edit the timeline based on user requests and return the complete modified timeline.

## TypeScript Schema (FOLLOW EXACTLY):

\`\`\`typescript
interface Clip {
  id: string;
  trackId: string;
  type: 'video' | 'audio' | 'image' | 'text';  // REQUIRED explicit type

  // Timeline positioning
  startTime: number;        // Position in seconds
  duration: number;         // Duration in seconds
  startInFrames: number;    // Position in frames (30fps)
  durationInFrames: number; // Duration in frames (30fps)

  // Media properties (for video/audio/image clips)
  assetId?: string;
  assetUrl?: string;
  trimStart?: number;
  trimEnd?: number;
  volume?: number;    // 0-1
  muted?: boolean;

  // Text properties (for text clips)
  text?: string;
  style?: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;        // hex codes like "#FFFFFF"
    textShadow?: string;
  };

  // Visual properties
  scale?: number;
  position?: { x: number; y: number; unit?: string };
  rotation?: number;
  opacity?: number;

  // UI (required)
  name: string;
  color: string;
  selected: boolean;

  // Optional
  metadata?: { transcript?: string; scene?: string; tags?: string[] };
  // effects?: Array<{ type: string; durationInFrames: number }>; // DISABLED - causes rendering issues
}

interface Track {
  id: string;
  name: string;
  height: number;
  muted: boolean;
  locked: boolean;
  color: string;
  clips: Clip[];
}

interface VideoTimeline {
  project: { width: number; height: number; fps: number };
  timeline: Track[];
}
\`\`\`

## Current Timeline:
${JSON.stringify(currentTimeline, null, 2)}

## Available Assets (Video Library):
Media assets: ${assetsStatus}
${assets && assets.length > 0 ? JSON.stringify(assets, null, 2) : 'No media assets available'}

## User Request:
"${userMessage}"

## Instructions:
1. **Always return COMPLETE timeline** (don't ask questions)
2. **Calculate frame values**: startInFrames = startTime * 30, durationInFrames = duration * 30
3. **Set explicit 'type' field** for all clips ('video', 'audio', 'image', 'text')
4. **For text clips**: Include text, style with defaults (fontFamily: "Arial, sans-serif", fontSize: 48, fontWeight: "bold", color: "#FFFFFF")
5. **For media clips**: Use assetId and assetUrl from available assets. Set type based on asset.type
6. **NO EFFECTS**: Do NOT include effects field in clips - causes rendering issues
7. **Preserve existing content** unless told to remove it
8. **Use UNIQUE IDs**: Generate unique clip IDs (e.g., text-1, text-2, video-1) - NEVER reuse IDs
9. **Track IDs**: Keep existing track IDs when possible (track-1, track-2, ai-track-1, ai-track-2)

## Common Operations:
- **Add text**: Create new clip with type="text", set text and style
- **Add video**: Create new clip with type="video"/"audio"/"image", use assetId and assetUrl from assets
- **Change text**: Find existing text clips, update text field
- **Move clips**: Adjust startTime and startInFrames
- **Style changes**: Update style object

## Video Asset Usage:
To add a video/image/audio clip:
1. Find the asset in the assets array by name or type
2. Create clip with assetId=asset.id and assetUrl=asset.url
3. Set type to match asset.type ('video', 'audio', 'image')
4. Set duration to asset.duration or desired length
5. Use trimStart/trimEnd for partial clips (in seconds)

## Response Format:
Brief explanation followed by:

\`\`\`json
{
  "project": {"width": 1920, "height": 1080, "fps": 30},
  "timeline": [
    // Complete modified timeline here
  ]
}
\`\`\`

Process the request and return the complete modified timeline.`;
}

module.exports = {
  generatePrompt: generateSimplifiedPrompt,  // Use simplified by default
  generateSimplifiedPrompt,
  generateComplexPrompt: generateComplexVideoEditingPrompt,  // Keep complex as backup
  parseTimelineFromResponse,
  cleanResponseText,
  detectEditingOperation,
  generateVideoEditingPrompt: generateComplexVideoEditingPrompt,
  generateVideoAnalysisPrompt: generateComplexVideoAnalysisPrompt
};