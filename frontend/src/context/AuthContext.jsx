import React, { createContext, useState, useEffect } from "react";

// Buat Context
export const AuthContext = createContext();

// Buat Provider
export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    // ✅ Baca dari localStorage saat pertama kali load
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
                setIsLoggedIn(true);
            } catch (e) {
                console.error("❌ Gagal parsing user dari localStorage:", e);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
            }
        }
    }, []);

    const login = (userData) => {
        setIsLoggedIn(true);
        setUser(userData);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
