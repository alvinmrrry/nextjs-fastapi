import React from 'react';
// import { TileData } from '../types'; // Will be used later

interface TileProps {
  id: number;
  value: number; // Or string, depending on how we represent tile types
  image?: string; // Optional image for the tile
  isSelected: boolean;
  isMatched: boolean;
  onClick: (id: number) => void;
}

const Tile: React.FC<TileProps> = ({
  id,
  value,
  image,
  isSelected,
  isMatched,
  onClick,
}) => {
  if (isMatched) {
    return (
      <div className="w-16 h-16 border-2 border-transparent rounded flex items-center justify-center opacity-0 pointer-events-none">
        {/* Matched tiles are invisible and non-interactive */}
      </div>
    );
  }

  return (
    <div
      className={`
        w-16 h-16 border-2 rounded flex items-center justify-center 
        text-xl font-bold cursor-pointer transition-all duration-150
        ${isSelected ? 'bg-yellow-400 border-yellow-600' : 'bg-gray-500 border-gray-600 hover:bg-yellow-300'}
      `}
      onClick={() => onClick(id)}
    >
      {image ? (
        <img src={image} alt={`Tile ${value}`} className="w-12 h-12 object-contain" />
      ) : (
        value
      )}
    </div>
  );
};

export default Tile;
