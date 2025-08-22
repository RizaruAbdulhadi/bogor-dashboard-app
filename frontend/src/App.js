import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CreateKWPiutang from './pages/piutang/CreateKWPiutang';
import CetakPiutang from './pages/piutang/CetakPiutang';
import LihatDataPiutang from './pages/piutang/LihatDataPiutang';
import MasterBank from './pages/master/MasterBank';
import PimpinanPage from './pages/master/PimpinanPage';
import DebiturPage from './pages/master/DebiturPage';
import MasterOutlet from './pages/master/Outlet';
import UploadFaktur from './pages/hutang/upload/UploadFaktur';
import DataFaktur from './pages/hutang/data/DataFaktur';
import AgingHD from './pages/hutang/aging/AgingHD';
import KrediturPage from './pages/master/KrediturPage';


function App() {
    return (
        <Router>
            <Routes>
                <Route>
                <Route path="/" element={<LoginPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/master-bank" element={<MasterBank />} />
                <Route path="/pimpinan" element={<PimpinanPage />} />
                <Route path="/master-debitur" element={<DebiturPage />} />
                <Route path="/master-outlet" element={<MasterOutlet />} />
                <Route path="/buat-kwitansi" element={<CreateKWPiutang />} />
                <Route path="/lihat" element={<LihatDataPiutang />} />
                <Route path="/cetak-kwitansi/:id" element={<CetakPiutang />} />
                <Route path="/hutang/upload" element={<UploadFaktur />} />
                <Route path="/hutang/data" element={<DataFaktur />} />
                <Route path="/hutang/aging" element={<AgingHD />} />
                <Route path="/master-kreditur" element={<KrediturPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
