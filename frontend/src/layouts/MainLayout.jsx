import React from 'react';
import Header from '../components/Header';
import SideBar from '../components/Sidebar';


function MainLayout({ children }) {
    return (
        <div className="flex h-screen">
            <SideBar />

            <div className="flex-1 flex flex-col">
                <Header />

                <main className="p-4 overflow-y-auto">{children}</main>
            </div>

        </div>
    );
}

export default MainLayout;
