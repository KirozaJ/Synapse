# 🧠 Synapse

> **A Cloud-Connected Personal Knowledge Graph**

Synapse is a modern note-taking application designed to help you discover connections between your ideas. It combines a distraction-free markdown editor with a powerful graph visualization, now powered by **Supabase** for secure cloud synchronization across all your devices.

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

### ☁️ Cloud & Security
*   **Supabase Backend**: Secure, scalable database for your notes.
*   **Authentication**: Individual User Accounts with Email/Password.
*   **Row Level Security (RLS)**: Your data is private and only accessible by you.
*   **Legacy Migration**: Built-in tool to migrate your old local notes to the cloud.

### ⚡ Efficient Workflow
*   **Full Search**: Global search (`Ctrl+K`) with real-time highlighting.
*   **Keyboard Driven**:
    *   `Ctrl+K`: Open Search
    *   `Ctrl+O`: New Note
    *   `[[`: Trigger Autocomplete



## 🏗️ Technology Stack

*   **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **State & Storage**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
*   **Visualization**: [react-force-graph](https://github.com/vasturiano/react-force-graph)
*   **Styling**: Vanilla CSS (Performance focused) + Lucide Icons

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
