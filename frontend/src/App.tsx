import { Timeline } from "./components/Timeline/Timeline";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Vibe Movie</h1>
      </header>
      <main className="app-main">
        <Timeline />
      </main>
    </div>
  );
}

export default App;
