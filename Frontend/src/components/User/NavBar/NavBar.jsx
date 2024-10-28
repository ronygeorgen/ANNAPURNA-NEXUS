import React from "react";

function NavBar({ handleLogout }) {

    return (
        <>
            <nav className="fixed w-full z-50 bg-white/30 backdrop-blur-sm shadow-sm">
                <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                    <svg className="w-10 h-10 mr-3" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="#38B2AC" strokeWidth="10"/>
                    <path d="M50 25L75 75H25L50 25Z" fill="#F6AD55"/>
                </svg>
                    <span className="font-bold text-xl text-orange-500">ANNAPURNA NEXUS</span>
                    </div>
                    <div className="hidden md:flex space-x-4">
                    <a href="#" className="text-gray-700 hover:text-orange-500">Home</a>
                    <a href="#" className="text-gray-700 hover:text-orange-500">About</a>
                    <a href="#" className="text-gray-700 hover:text-orange-500">Services</a>
                    <a href="#" className="text-gray-700 hover:text-orange-500">Contact</a>
                    <a href="#" onClick={handleLogout} className="text-gray-700 hover:text-orange-500 cursor-pointer">
                        Logout
                        </a>
                    </div>
                    <div className="md:hidden">
                    <button className="text-gray-700 hover:text-orange-500">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    </div>
                </div>
                </div>
            </nav>
        </>
    )
}

export default NavBar;