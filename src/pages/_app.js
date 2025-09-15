import Header from "@/Components/Header";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {" "}
        <Component {...pageProps} />
      </ThemeProvider>
    </AuthProvider>
  );
}
