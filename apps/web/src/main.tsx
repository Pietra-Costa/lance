import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyTheme, readStoredTheme, resolveTheme } from "./theme/useTheme.ts";
import "./index.css";

// O index.html já aplica o tema antes do primeiro paint (evita flash). Aqui só
// garantimos que o estado do documento esteja consistente com o storage.
applyTheme(resolveTheme(readStoredTheme()));

createRoot(document.getElementById("root")!).render(<App />);
