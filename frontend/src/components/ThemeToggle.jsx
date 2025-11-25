import { motion } from "framer-motion";
import React from "react";
import { useTheme } from "../App";

export default function ThemeToggle() {
    const { darkMode, toggleTheme } = useTheme();

    return (
        <motion.button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
            title={darkMode ? "Modo claro" : "Modo escuro"}
        >
            <motion.span
                key={darkMode ? "moon" : "sun"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {darkMode ? "☀️" : "🌙"}
            </motion.span>
        </motion.button>
    );
}


