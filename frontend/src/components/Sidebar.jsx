import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const SideBar = () => {
    return (
        <div className="w-72 min-h-screen bg-slate-900 shadow-lg p-6 text-white flex flex-col print:hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
                <div className="w-6 h-6 bg-sky-500 rounded" />
                <span className="text-xl font-semibold">Tools Staff</span>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-2 flex-grow">
                <SideItem label="Dashboard" path="/dashboard" icon="📊" />

                <SideItem
                    label="Master Data"
                    icon="📁"
                    submenuItems={[
                        { label: 'Master Bank', path: '/master-bank', icon: '🏦' },
                        { label: 'Master Pimpinan', path: '/pimpinan', icon: '👨‍💼' },
                        { label: 'Master Debitur', path: '/master-debitur', icon: '👤' },
                        { label: 'Master Outlet', path: '/master-outlet', icon: '🏪' },
                        { label: 'Master Kreditur', path: '/master-kreditur', icon: '🏛️' }
                    ]}
                />

                <SideItem
                    label="Piutang Dagang"
                    icon="💰"
                    submenuItems={[
                        { label: 'Buat Kwitansi', path: '/buat-kwitansi', icon: '🧾' },
                        { label: 'Kwitansi', path: '/lihat', icon: '📑' }
                    ]}
                />

                <SideItem
                    label="Hutang Dagang"
                    icon="📉"
                    submenuItems={[
                        { label: 'Upload Stat Faktur', path: '/hutang/upload-faktur', icon: '📤' },
                        { label: 'Upload Detail Beli', path: '/hutang/upload-faktur-beli', icon: '📥' },
                        { label: 'Hutang Dagang', path: '/hutang/data', icon: '📋' },
                        { label: 'Monitoring Entri Faktur', path: '/hutang/monitoring-beli', icon: '👀' },
                        { label: 'Aging HD', path: '/hutang/aging', icon: '📊' }
                    ]}
                />

                <SideItem label="KAS Bank" path="/kas-bank" icon="💳" />
            </nav>

            {/* Logout Button */}
            <button
                onClick={() => {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
            >
                <span>🚪</span>
                <span>Logout</span>
            </button>
        </div>
    );
};

const SideItem = ({ label, path, submenuItems = [], icon }) => {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const isActive = path && location.pathname === path;

    // Check if any submenu is active
    const isSubmenuActive = submenuItems.some(sub => location.pathname === sub.path);

    // Automatically open submenu if current page is in submenu
    useEffect(() => {
        if (isSubmenuActive) {
            setOpen(true);
        }
    }, [isSubmenuActive, location.pathname]);

    return (
        <div>
            {/* Main item */}
            {submenuItems.length === 0 ? (
                <Link to={path}>
                    <div
                        className={`px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 ${
                            isActive
                                ? 'bg-sky-600 text-white font-semibold'
                                : 'hover:bg-slate-800 text-indigo-200'
                        }`}
                    >
                        {icon && <span>{icon}</span>}
                        <span>{label}</span>
                    </div>
                </Link>
            ) : (
                <div>
                    <div
                        onClick={() => setOpen(!open)}
                        className={`px-4 py-2 rounded-md cursor-pointer flex justify-between items-center ${
                            isSubmenuActive
                                ? 'bg-sky-600 text-white font-semibold'
                                : 'hover:bg-slate-800 text-indigo-200'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {icon && <span>{icon}</span>}
                            <span>{label}</span>
                        </div>
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

                    {/* Submenu */}
                    {open && (
                        <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-slate-700 pl-2 py-1">
                            {submenuItems.map((sub, i) => {
                                const isSubActive = location.pathname === sub.path;
                                return (
                                    <Link to={sub.path} key={i}>
                                        <div
                                            className={`px-3 py-1.5 text-sm rounded cursor-pointer flex items-center gap-2 ${
                                                isSubActive
                                                    ? 'bg-sky-500 text-white font-medium'
                                                    : 'text-indigo-200 hover:bg-slate-700'
                                            }`}
                                        >
                                            {sub.icon && <span className="text-xs">{sub.icon}</span>}
                                            <span>{sub.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SideBar;