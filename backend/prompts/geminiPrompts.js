const { REMOTION_KNOWLEDGE, TIMELINE_EXAMPLES, COMMON_OPERATIONS } = require('./remotionKnowledge');
const { TIMELINE_OPERATIONS, validateTimeline, DEFAULT_PROJECT } = require('./timelineHelpers');

/**
 * Generate comprehensive prompt for Gemini AI with deep Remotion knowledge
 */
function generateVideoEditingPrompt(userMessage, currentTimeline, hasVideo = false) {
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
 */
function generateVideoAnalysisPrompt(userMessage, currentTimeline, videoDescription = '') {
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
 */
function generatePrompt(userMessage, currentTimeline, hasVideo = false) {
  // Ensure timeline has proper structure
  const timeline = currentTimeline || {
    project: DEFAULT_PROJECT,
    timeline: []
  };

  if (hasVideo) {
    return generateVideoAnalysisPrompt(userMessage, timeline);
  } else {
    return generateVideoEditingPrompt(userMessage, timeline);
  }
}

module.exports = {
  generatePrompt,
  parseTimelineFromResponse,
  cleanResponseText,
  detectEditingOperation,
  generateVideoEditingPrompt,
  generateVideoAnalysisPrompt
};