# VibeMovie

**Chat your way to the perfect video.**

VibeMovie is an AI-native video editor that redefines the creation process. Instead of a complex timeline and a sea of buttons, you direct the edit through a simple, conversational chat. Tell our AI assistant what you want to see, and watch it build your video in real time.

## What is This?

Traditional video editing software is powerful but often comes with a steep learning curve that can get in the way of creativity. We wanted to change that. VibeMovie is our vision for a more intuitive workflow, where your creative intent is translated directly into a finished product.

You can start with a raw video or a blank canvas and simply tell the AI what to do:
*   "Add a title that says 'My Trip to the Mountains'."
*   "Cut the first 5 seconds of the video."
*   "Make the title text red and have it slide in from the bottom."
*   "Put a slow fade-out at the end."

The AI acts as your creative partner, programmatically building a video composition that you can preview instantly and export when you're done.

## Core Features

*   **Conversational Editing:** A chat interface powered by the Google Gemini API to control the entire editing process.
*   **Dynamic Visual Timeline:** A real-time, interactive timeline that visualizes the video structure as the AI makes changes.
*   **Hybrid Control:** Full AI control supplemented with direct manual manipulation. You can always fine-tune the AI's work by dragging, trimming, and splitting clips by hand.
*   **Remotion-Powered Preview:** A frame-accurate live preview of the final video, rendered on the fly.
*   **Server-Side Export:** A robust backend rendering pipeline that can export your final creation to a high-quality MP4 file.

## How It Works

VibeMovie is built on a simple but powerful idea: a video can be represented as a structured data object (JSON).

1.  **The User** sends a command through the chat interface.
2.  **The Frontend** bundles the command and the current timeline state and sends it to the backend.
3.  **The Backend** constructs a detailed prompt for the **Google Gemini API**, asking it to return a modified JSON object that reflects the user's request.
4.  **The Frontend** receives the new timeline state, updates its store, and re-renders the visual timeline and video preview.
5.  **Remotion** acts as the rendering engine, taking the JSON timeline and turning it into a visual output, both for the live preview and the final export.

## Tech Stack

**Frontend:**
*   **Framework:** React with Vite
*   **Rendering:** Remotion
*   **State Management:** Zustand
*   **Drag & Drop:** @dnd-kit

**Backend:**
*   **Framework:** Node.js with Express
*   **Generative AI:** Google Gemini API
*   **Video Rendering:** Remotion (`@remotion/renderer`)

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

*   Node.js (v18 or later is recommended)
*   npm
*   A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://your-repository-url/vibemovie.git
    cd vibemovie
    ```

2.  **Install Frontend Dependencies:**
    ```sh
    cd frontend
    npm install
    ```

3.  **Install Backend Dependencies:**
    ```sh
    cd ../backend
    npm install
    ```

4.  **Set up Environment Variables:**
    *   In the `backend` directory, create a `.env` file.
    *   Add your Gemini API key to it:
        ```env
        GEMINI_API_KEY=your_api_key_here
        ```

### Running the Application

1.  **Start the Backend Server:**
    *   From the `backend` directory, run:
    ```sh
    npm run dev
    ```
    The server will start on port 3001.

2.  **Start the Frontend Application:**
    *   In a new terminal, from the `frontend` directory, run:
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Usage

Once the application is running, you can:
1.  **Upload Media:** Use the "Upload Media" button to add video files to your media library.
2.  **Chat with the AI:** Type commands into the chat panel on the right to start building your video.
3.  **Fine-Tune Manually:** Use your mouse to drag, trim, or split clips on the timeline.
4.  **Export:** When you're ready, click the "Export Video" button to render and download your final MP4.
