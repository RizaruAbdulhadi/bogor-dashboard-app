import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
    const { isLoggedIn } = useContext(AuthContext);
    console.log("PrivateRoute: isLoggedIn =", isLoggedIn);

    if (!isLoggedIn) {
        console.warn("PrivateRoute: belum login, redirect ke /login");
        return <Navigate to="/login" replace />;
    }

    console.log("PrivateRoute: sudah login, tampilkan children");
    return children;
};

export default PrivateRoute;
