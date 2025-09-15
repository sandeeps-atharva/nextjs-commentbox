// "use client";

// import { ThemeContext } from "@emotion/react";
// import { useEffect, useState } from "react";

// // import { createContext, useContext, useState, useEffect } from "react";
// // import { ThemeProvider, createTheme } from "@mui/material/styles";

// // const ThemeContext = createContext();

// // export const ThemeProviderWrapper = ({ children }) => {
// //   const [theme, setTheme] = useState("light");

// //   // Load saved theme and sync root class
// //   useEffect(() => {
// //     const storedTheme = localStorage.getItem("theme");
// //     const initialTheme = storedTheme || "light";
// //     setTheme(initialTheme);
// //     document.documentElement.classList.toggle("dark", initialTheme === "dark");
// //   }, []);

// //   const toggleTheme = () => {
// //     const newTheme = theme === "light" ? "dark" : "light";
// //     setTheme(newTheme);
// //     localStorage.setItem("theme", newTheme);
// //     document.documentElement.classList.toggle("dark", newTheme === "dark");
// //   };

// //   // Create synced MUI theme
// //   const muiTheme = createTheme({
// //     palette: {
// //       mode: theme,
// //       ...(theme === "dark"
// //         ? {
// //             background: { default: "#121212", paper: "#1e1e1e" },
// //             text: { primary: "#fff", secondary: "#bbb" },
// //           }
// //         : {}),
// //     },
// //   });

// //   return (
// //     <ThemeContext.Provider value={{ theme, toggleTheme }}>
// //       <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
// //     </ThemeContext.Provider>
// //   );
// // };

// // export const useThemeContext = () => useContext(ThemeContext);

// // // context/ThemeContext.js
// // "use client";
// // import { createContext, useContext, useEffect, useState } from "react";

// // const ThemeContext = createContext();

// export const ThemeProvider = ({ children }) => {
//   const [theme, setTheme] = useState("light");

//   // load theme from localStorage or system preference
//   useEffect(() => {
//     const storedTheme = localStorage.getItem("theme");
//     if (storedTheme) {
//       setTheme(storedTheme);
//       document.documentElement.classList.toggle("dark", storedTheme === "dark");
//     } else {
//       const prefersDark = window.matchMedia(
//         "(prefers-color-scheme: dark)"
//       ).matches;
//       setTheme(prefersDark ? "dark" : "light");
//       document.documentElement.classList.toggle("dark", prefersDark);
//     }
//   }, []);

//   const toggleTheme = () => {
//     const newTheme = theme === "light" ? "dark" : "light";
//     setTheme(newTheme);
//     localStorage.setItem("theme", newTheme);
//     document.documentElement.classList.toggle("dark", newTheme === "dark");
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// export const useTheme = () => useContext(ThemeContext);

// context/ThemeContext.js
"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  // load theme from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
