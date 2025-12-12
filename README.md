# 🧠 Synapse

> **A Local-First Personal Knowledge Graph**

Synapse is a modern, privacy-focused note-taking application designed to help you discover connections between your ideas. It combines a distraction-free markdown editor with a powerful graph visualization that evolves naturally as you write.

---

## ✨ Features

### 🕸️ Visual Knowledge Graph
*   **Force-Directed Graph**: Visualize every note as a node and every link as a connection.
*   **Dynamic Clustering**: Notes with the same `#tags` automatically cluster and color-code together.
*   **Interactive Exploration**: Click nodes to navigate instantly to the relevant note.

### 📝 Powerful Editor
*   **Smart Auto-Focus**: 
    *   New notes focus the **Title** field.
    *   Existing notes focus the **Content** (at the end).
*   **Dual View Modes**: Switch between **Write** (raw text), **Preview** (rendered), or **Split** (side-by-side).
*   **WikiLinks**: Type `[[` to instantly verify and link to other notes with autocomplete.
*   **Bidirectional Linking**: Renaming a note automatically updates links in all other notes. 🛡️
*   **Images**: Drag & Drop or Paste images directly. They are stored locally.

### ⚡ Built for Speed & Privacy
*   **Local-First**: All data is stored in your browser's IndexedDB. No servers, no accounts, no tracking.
*   **Offline Ready**: Works perfectly without an internet connection.
*   **Full Search**: Global search (`Ctrl+K`) with real-time highlighting and snippet previews.
*   **Keyboard Driven**:
    *   `Ctrl+K`: Open Search
    *   `Ctrl+O`: New Note
    *   `[[`: Trigger Autocomplete

### 🛠️ Data Management
*   **Import/Export**: Full JSON backup and restore capabilities.
*   **Maintenance Tools**: Built-in Garbage Collection to clean up unused images.

---

## 🚀 Quick Start

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/synapse.git
    cd synapse
    ```

2.  **Install dependencies**
    ```bash
    npm install
     # or
    yarn install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

---

## 🏗️ Technology Stack

*   **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **State & Storage**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
*   **Visualization**: [react-force-graph](https://github.com/vasturiano/react-force-graph)
*   **Styling**: Vanilla CSS (Performance focused) + Lucide Icons

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
