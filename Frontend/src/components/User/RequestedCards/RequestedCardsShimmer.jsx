import React from 'react';
import NavBar from '../NavBar/NavBar';

const RequestedCardsShimmer = () => {
  const ShimmerCard = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            <div className="h-6 bg-gray-300 rounded w-1/4"></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-4"></div>
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                <div className="h-2 bg-gray-300 rounded w-12 mt-1"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="h-10 bg-gray-300 rounded w-full"></div>
        </div>
      </div>
    );
  };

  return (
    
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Ration Card Dashboard</h1>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
              <div className="relative w-full md:w-64 h-10 bg-gray-300 rounded"></div>
              <div className="flex flex-wrap justify-center space-x-2">
                {['ALL', 'REQUESTED', 'SHOP_VERIFIED', 'ADMIN_APPROVED', 'CANCELLED'].map((status) => (
                  <div key={status} className="h-10 w-20 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((card) => (
              <ShimmerCard key={card} />
            ))}
          </div>
        </div>
      </div>
    
  );
};

export default RequestedCardsShimmer;