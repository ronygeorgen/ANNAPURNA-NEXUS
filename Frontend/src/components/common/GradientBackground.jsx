import React from 'react';

const GradientBackground = () => (
  <div className="w-1/2 bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center relative overflow-hidden">
    <div className="text-white text-center z-10">
      <h1 className="text-6xl font-bold mb-4">Unlock</h1>
      <h1 className="text-6xl font-bold mb-4">Your</h1>
      <h1 className="text-6xl font-bold mb-4">Subsidies</h1>
    </div>
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-200 rounded-full opacity-50"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-orange-300 rounded-full opacity-50"></div>
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-yellow-100 rounded-full opacity-50"></div>
    </div>
  </div>
);

export default GradientBackground;
