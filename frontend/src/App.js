import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CreateKWPiutang from "./pages/piutang/CreateKWPiutang";
import CetakPiutang from "./pages/piutang/CetakPiutang";
import LihatDataPiutang from "./pages/piutang/LihatDataPiutang";
import MasterBank from "./pages/master/MasterBank";
import PimpinanPage from "./pages/master/PimpinanPage";
import DebiturPage from "./pages/master/DebiturPage";
import MasterOutlet from "./pages/master/Outlet";
import UploadFaktur from "./pages/hutang/upload-faktur/UploadFaktur";
import UploadBeli from "./pages/hutang/upload-faktur-beli/UploadBeli";
import DataFaktur from "./pages/hutang/data/DataFaktur";
import AgingHD from "./pages/hutang/aging/AgingHD";
import KrediturPage from "./pages/master/KrediturPage";

import PrivateRoute from "./components/PrivateRoute";

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public Route */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />

                {/* Master Data Routes */}
                <Route
                    path="/master-bank"
                    element={
                        <PrivateRoute>
                            <MasterBank />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/pimpinan"
                    element={
                        <PrivateRoute>
                            <PimpinanPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/master-debitur"
                    element={
                        <PrivateRoute>
                            <DebiturPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/master-outlet"
                    element={
                        <PrivateRoute>
                            <MasterOutlet />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/master-kreditur"
                    element={
                        <PrivateRoute>
                            <KrediturPage />
                        </PrivateRoute>
                    }
                />

                {/* Piutang Routes */}
                <Route
                    path="/buat-kwitansi"
                    element={
                        <PrivateRoute>
                            <CreateKWPiutang />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/lihat-piutang"
                    element={
                        <PrivateRoute>
                            <LihatDataPiutang />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/cetak-kwitansi/:id"
                    element={
                        <PrivateRoute>
                            <CetakPiutang />
                        </PrivateRoute>
                    }
                />

                {/* Hutang Routes */}
                <Route
                    path="/hutang/upload-faktur"
                    element={
                        <PrivateRoute>
                            <UploadFaktur />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/hutang/upload-faktur-beli"
                    element={
                        <PrivateRoute>
                            <UploadBeli />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/hutang/data-faktur"
                    element={
                        <PrivateRoute>
                            <DataFaktur />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/hutang/aging-hd"
                    element={
                        <PrivateRoute>
                            <AgingHD />
                        </PrivateRoute>
                    }
                />

                {/* Catch all route - 404 Page */}
                <Route
                    path="*"
                    element={
                        <PrivateRoute>
                            <div className="p-4">
                                <h2>404 - Halaman Tidak Ditemukan</h2>
                                <p>Halaman yang Anda cari tidak exists.</p>
                            </div>
                        </PrivateRoute>
                    }
                />
            </Routes>
        </AuthProvider>
    );
}

export default App;