import React from 'react';
import Image from 'next/image'; // Import next/image

interface TileProps {
  id: number;
  value: number; 
  image?: string; 
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
        <Image src={image} alt={`Tile ${value}`} width={48} height={48} style={{ objectFit: 'contain' }} />
      ) : (
        <span className="text-2xl">{value}</span> // Ensure number is also styled if needed
      )}
    </div>
  );
};

export default Tile;
