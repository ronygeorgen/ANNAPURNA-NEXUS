import React from "react";
import { Bell, Search, ChevronDown } from "lucide-react";

function AdminHeader() {
    return (
        <header className="flex justify-between items-center mb-8">
            <div className="relative">
            <input
                type="text"
                placeholder="Search..."
                className="bg-teal-800 bg-opacity-50 text-white placeholder-teal-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-teal-300" />
            </div>
            <div className="flex items-center space-x-4">
            <button className="relative text-teal-300 hover:text-white transition-colors duration-200">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-orange-500 rounded-full"></span>
            </button>
            <div className="flex items-center">
                <img src="/placeholder.svg?height=40&width=40" alt="Admin" className="w-10 h-10 rounded-full border-2 border-teal-500" />
                <span className="ml-2 text-white">Admin</span>
                <ChevronDown className="ml-1 h-4 w-4 text-teal-300" />
            </div>
            </div>
        </header>
    );
}

export default AdminHeader;