import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
    const { isLoggedIn, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="text-center mt-20">Loading...</div>; // ✅ jangan langsung redirect
    }

    if (!isLoggedIn) {
        console.log("PrivateRoute: belum login, redirect ke /login");
        return <Navigate to="/login" replace />;
    }

    console.log("PrivateRoute: sudah login, tampilkan children");
    return children;
};

export default PrivateRoute;
