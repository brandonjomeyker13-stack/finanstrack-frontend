import "./app.css";
import { App } from "./App";
import { AuthProvider } from "./auth";

export default function Shell() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
