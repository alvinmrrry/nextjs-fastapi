"use client";

import React from 'react';
import Board from './components/Board';

const OnetConnectPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-4">
      <h1 className="text-4xl font-bold mb-8">Onet Connect Game</h1>
      <Board />
      {/* <p className="mt-8">Game board will be here.</p> */}
      <div className="mt-4">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OnetConnectPage;
