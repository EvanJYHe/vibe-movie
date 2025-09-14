# VibeMovie: An AI-Native Video Editor

## 💡 Inspiration

The world of video editing is filled with powerful, professional-grade tools that are capable of producing cinematic masterpieces. However, this power often comes at the cost of complexity. Steep learning curves, cluttered interfaces with hundreds of buttons, and the manual nature of timeline-based editing can feel more like operating heavy machinery than engaging in a creative act.

We were inspired by the recent breakthroughs in conversational AI and asked ourselves: **What if you could create a video just by describing it?**

We envisioned a tool that would remove the technical barriers and allow creators to focus purely on their vision. Instead of searching through menus to find the "fade" effect, you could simply ask our AI assistance, Gemini AI:

> "Fade in the title text."

Instead of manually scrubbing a timeline to find a scene, you could say:

> "Cut to the part where the rocket launches."

This desire to make video creation as intuitive and fluid as a conversation was the core inspiration for VibeMovie. In addition, you also get the freedom of a typical video editor, allowing straightforward user experience to navigate the editing platform with options to edit your video manually with our built-in tools.

---

## 🎬 What it does

**VibeMovie** is an AI-native video editor that turns natural language into a rendered video. It works like a creative partner. A user can start with a raw video file, or even a blank canvas, and direct the entire editing process through a simple chat interface.

### 💬 Chat-Based Editing
Users can ask the AI to perform a wide range of editing tasks, such as:
- "Add a title that says 'My Awesome Trip'."
- "Cut the first 5 seconds of the video."
- "Put a smooth fade-out effect at the end."
- "Make the text on screen red and larger."

### 📊 Live Visual Timeline
While the user chats with the AI, a dynamic timeline provides a real-time visual representation of the video's structure. Users can see the clips, tracks, and their arrangement as the AI makes changes.

### 👉 Direct Manipulation
Although AI-driven, the interface still allows for direct, hands-on adjustments. Users can drag clips to change their timing, trim their edges, or split them with a double-click.

### ✨ High-Quality Export
Once the user is happy with the result, they can click the "Export" button to have the entire composition rendered into a high-quality `MP4` video, with all the AI-generated edits, effects, and assets included.

---

## 🛠️ How we built it

VibeMovie is architected as a modern monorepo application, with a clear separation between the frontend interface and the backend AI logic.

### 🖥️ Frontend
The interface is built with `React` and `Vite`.
- The core of the application is a custom-built, interactive timeline component that uses `@dnd-kit` for precise drag-and-drop interactions.
- State management is handled by `Zustand`, which holds the entire video structure as a JSON-like object. This "single source of truth" makes the state predictable and easy to manage.
- For the live video preview, we integrated the `@remotion/player`. This powerful component takes the timeline data from our `Zustand` store and renders a frame-accurate preview of the final video, allowing users to see their changes instantly.

### 🧠 Backend
The server is a `Node.js` and `Express` application that serves as the "brain" of the editor.
- It uses the **Google Gemini API** to process user requests. We engineered a highly detailed prompt that gives the AI context about the video's current state and teaches it how to respond with a modified, valid `JSON` timeline.
- For the export functionality, the backend becomes a powerful rendering engine. It uses `@remotion/bundler` to dynamically create a Remotion project in a temporary file, and `@remotion/renderer` to programmatically render the composition into an `MP4` file using a headless Chrome instance.

### 🌉 The Bridge
The entire system hinges on a declarative data structure. The video isn't stored as a video file being cut up; it's a `JSON` object that describes how to assemble the final video from various assets and effects. Both the user and the AI manipulate this object, and Remotion simply renders the result.

---

## 🚧 Challenges we ran into

### AI Reliability and Structured Data
Getting a large language model to consistently output valid `JSON` that adheres to a complex, nested schema was our biggest hurdle. A single misplaced comma or bracket from the AI could crash the entire application. We solved this through meticulous prompt engineering, providing the AI with clear instructions, examples of valid schemas, and implementing a validation layer on our backend to catch and sanitize the AI's output.

### Asset Management for Server-Side Rendering
A critical issue we discovered during development was handling asset URLs. The frontend uses `blob:` URLs for uploaded media, which are only accessible within the user's browser. Our backend rendering server had no way to access these. We engineered a solution where the frontend identifies these local assets, uploads them as files to the backend just before rendering, and the backend maps them to temporary, server-accessible URLs.

### Real-Time Feedback Loop
We wanted the user experience to be seamless. When the AI made a change, the timeline and video preview had to update instantly. This required a robust state management system and careful handling of the data flow between the backend, our `Zustand` store, and the various `React` components.

---

## 🏆 Accomplishments that we're proud of

### A Truly Conversational Interface
We succeeded in creating an editor where complex actions can be triggered by simple, intuitive language. Watching the AI correctly interpret a command like *"add a title and make it slide in from the bottom"* and then seeing it reflected instantly on the timeline is a magical experience.

### The Hybrid Editing Model
We're proud of the seamless integration between AI-driven editing and direct manual manipulation. The user is never locked into the AI's choices; they can always fine-tune the results by hand, offering the best of both worlds.

### The Server-Side Rendering Pipeline
Building a fully automated, on-demand video rendering service on the backend was a significant technical achievement. It allows for high-quality, reliable exports without freezing the user's browser, which is a common problem with client-side video rendering.

---

## 🎓 What we learned

Throughout this project, we learned that the future of creative software lies in abstracting complexity. The most powerful tool isn't necessarily the one with the most features, but the one that provides the most intuitive path from an idea to a result.

Representing the entire video as a declarative `JSON` object was a revelation. It treated the video not as a monolithic file, but as a "script" that could be programmatically written, edited, and remixed. This approach makes it incredibly scalable and opens the door for even more powerful AI integrations in the future.

---

## 🗺️ What's next for VibeMovie

This hackathon project is just the beginning. We're excited about the potential to expand on this foundation:

-   **Advanced AI Capabilities:** Integrating more sophisticated AI models that can analyze video content (e.g., detecting scenes, identifying objects, generating transcripts) to perform even smarter edits.
-   **Real-Time Collaboration:** Allowing multiple users to edit the same timeline, with the AI acting as a moderator and assistant.
-   **Template Library:** Introducing a library of pre-built templates and effects that users can apply and customize through conversation.
-   **Expanding Media Support:** Adding support for more complex media types, such as images, GIFs, and more advanced audio mixing.
