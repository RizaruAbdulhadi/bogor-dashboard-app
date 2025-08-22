import React, { useState } from 'react';
import { Link, useLocation  } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const SideBar = () => {
    const navigate = useNavigate();
    return (
        <div className="w-72 min-h-screen bg-slate-900 shadow-lg p-6 text-white flex flex-col print:hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
                <div className="w-6 h-6 bg-sky-500 rounded" />
                <span className="text-xl font-semibold">Tools Staff</span>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-2">
                <SideItem label="Dashboard" path="/dashboard" />
                <SideItem label="Master Data"
                submenuItems={[
                    { label: 'Master Bank', path:'/master-bank'},
                    { label: 'Master Pimpinan', path:'/pimpinan'},
                    { label: 'Master Debitur', path:'/master-debitur'},
                    { label: 'Master Outlet', path:'/master-outlet'},
                    { label: 'Master Kreditur', path:'/master-kreditur'}
                ]}/>
                <SideItem
                    label="Piutang Dagang"
                    submenuItems={[
                        { label: 'Buat Kwitansi', path: '/buat-kwitansi' },
                        { label: 'Kwitansi', path: '/lihat' }
                    ]}
                />
                <SideItem label="Hutang Dagang"
                submenuItems={[
                { label: 'Upload Stat Faktur', path: '/hutang/upload' },
                { label: 'Hutang Dagang', path: '/hutang/data' },
                { label: 'Aging HD', path: '/hutang/aging' }
                    ]}
                />
                <SideItem label="KAS Bank" />
            </nav>
            <button
                onClick={() => {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
                Logout
            </button>

        </div>
    );
};

const SideItem = ({ label, path, submenuItems = [] }) => {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const isActive = path && location.pathname === path;

    // Check if any submenu is active
    const isSubmenuActive = submenuItems.some(sub => sub.path === location.pathname);


    return (
        <div>
            {/* Main item */}
            {submenuItems.length === 0 ? (
                <Link to={path}>
                    <div
                        className={`px-4 py-2 rounded-md cursor-pointer ${
                            isActive ? 'bg-slate-400 text-white font-semibold' : 'hover:bg-slate-800 text-indigo-300'
                        }`}
                    >
                        {label}
                    </div>
                </Link>
            ) : (
                <div
                    onClick={() => setOpen(!open)}
                    className={`px-4 py-2 rounded-md cursor-pointer flex justify-between items-center ${
                        isSubmenuActive ? 'bg-slate-400 text-white font-semibold' : 'hover:bg-slate-800 text-indigo-300'
                    }`}
                >
                    <span>{label}</span>
                    <svg
                        className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            )}

            {/* Submenu */}
            {open && submenuItems.length > 0 && (
                <div className="ml-6 mt-1 flex flex-col gap-1">
                    {submenuItems.map((sub, i) => (
                        <Link to={sub.path} key={i}>
                            <div
                                className={`px-4 py-1 text-sm rounded cursor-pointer ${
                                    location.pathname === sub.path
                                        ? 'bg-slate-500 text-white font-semibold'
                                        : 'text-indigo-300 hover:bg-slate-700'
                                }`}
                            >
                                {sub.label}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SideBar;
