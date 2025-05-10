"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tile from './Tile';
import { TileData } from '../types';

const BOARD_ROWS = 6;
const BOARD_COLS = 10;
const NUM_UNIQUE_TILES = (BOARD_ROWS * BOARD_COLS) / 2;

interface BoardProps {}

const INITIAL_TIME = 10 * 60; 
const MUSIC_PLAYLIST = ['M800003SSoRr0UHx45.mp3'];

const Board: React.FC<BoardProps> = () => {
  const [board, setBoard] = useState<TileData[][]>([]);
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null);
  const [score, setScore] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(INITIAL_TIME);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isLoadingBoard, setIsLoadingBoard] = useState<boolean>(true); // For loading message
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const isTileAvailableForPath = useCallback((r: number, c: number, boardState: TileData[][], tile1Id: number, tile2Id: number): boolean => {
    if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) return true; 
    const tile = boardState[r][c];
    return tile.isMatched || tile.id === tile1Id || tile.id === tile2Id;
  }, []);

  const isStraightPathClear = useCallback((r1: number, c1: number, r2: number, c2: number, boardState: TileData[][], tile1Id: number, tile2Id: number): boolean => {
    if (r1 === r2) { 
      for (let col = Math.min(c1, c2) + 1; col < Math.max(c1, c2); col++) {
        if (!isTileAvailableForPath(r1, col, boardState, tile1Id, tile2Id)) return false;
      }
    } else if (c1 === c2) { 
      for (let row = Math.min(r1, r2) + 1; row < Math.max(r1, r2); row++) {
        if (!isTileAvailableForPath(row, c1, boardState, tile1Id, tile2Id)) return false;
      }
    } else {
      return false; 
    }
    return true;
  }, [isTileAvailableForPath]);
  
  const canConnect = useCallback((tile1: TileData, tile2: TileData, boardState: TileData[][]): boolean => {
    const { row: r1, col: c1, id: id1 } = tile1;
    const { row: r2, col: c2, id: id2 } = tile2;

    if (id1 === id2) return false; 

    if (r1 === r2 && isStraightPathClear(r1, c1, r2, c2, boardState, id1, id2)) return true;
    if (c1 === c2 && isStraightPathClear(r1, c1, r2, c2, boardState, id1, id2)) return true;

    if (isTileAvailableForPath(r1, c2, boardState, id1, id2) &&
        isStraightPathClear(r1, c1, r1, c2, boardState, id1, id2) &&
        isStraightPathClear(r1, c2, r2, c2, boardState, id1, id2)) {
      return true;
    }
    if (isTileAvailableForPath(r2, c1, boardState, id1, id2) &&
        isStraightPathClear(r1, c1, r2, c1, boardState, id1, id2) &&
        isStraightPathClear(r2, c1, r2, c2, boardState, id1, id2)) {
      return true;
    }

    for (let c = -1; c <= BOARD_COLS; c++) { 
      if (isTileAvailableForPath(r1, c, boardState, id1, id2) && 
          isTileAvailableForPath(r2, c, boardState, id1, id2) && 
          isStraightPathClear(r1, c1, r1, c, boardState, id1, id2) && 
          isStraightPathClear(r1, c, r2, c, boardState, id1, id2) &&   
          isStraightPathClear(r2, c, r2, c2, boardState, id1, id2)) {  
        return true;
      }
    }
    for (let r = -1; r <= BOARD_ROWS; r++) { 
      if (isTileAvailableForPath(r, c1, boardState, id1, id2) && 
          isTileAvailableForPath(r, c2, boardState, id1, id2) && 
          isStraightPathClear(r1, c1, r, c1, boardState, id1, id2) && 
          isStraightPathClear(r, c1, r, c2, boardState, id1, id2) &&   
          isStraightPathClear(r, c2, r2, c2, boardState, id1, id2)) {  
        return true;
      }
    }
    return false;
  }, [isTileAvailableForPath, isStraightPathClear]);

  const internalHasValidMove = useCallback((currentBoardState: TileData[][]): boolean => {
    if (!currentBoardState || currentBoardState.length === 0) return false;
    const unmatchedTiles: TileData[] = [];
    for (const row of currentBoardState) {
      for (const tile of row) {
        if (!tile.isMatched) {
          unmatchedTiles.push(tile);
        }
      }
    }
    for (let i = 0; i < unmatchedTiles.length; i++) {
      for (let j = i + 1; j < unmatchedTiles.length; j++) {
        const tile1 = unmatchedTiles[i];
        const tile2 = unmatchedTiles[j];
        if (tile1.value === tile2.value) {
          if (canConnect(tile1, tile2, currentBoardState)) { 
            return true; 
          }
        }
      }
    }
    return false; 
  }, [canConnect]); 

  const solveBoardRecursively = useCallback((currentBoardState: TileData[][], depth = 0): boolean => {
    const MAX_SOLVER_DEPTH = (BOARD_ROWS * BOARD_COLS) / 2 + 5; 
    if (depth > MAX_SOLVER_DEPTH) {
      console.warn("Solver reached max depth, assuming not easily solvable.");
      return false;
    }
    if (currentBoardState.every(row => row.every(tile => tile.isMatched))) {
      return true; 
    }
    const unmatchedTiles: TileData[] = [];
    for (const row of currentBoardState) {
      for (const tile of row) {
        if (!tile.isMatched) {
          unmatchedTiles.push(tile);
        }
      }
    }
    const possibleMoves: Array<{ tile1: TileData, tile2: TileData }> = [];
    for (let i = 0; i < unmatchedTiles.length; i++) {
      for (let j = i + 1; j < unmatchedTiles.length; j++) {
        const t1 = unmatchedTiles[i];
        const t2 = unmatchedTiles[j];
        if (t1.value === t2.value && canConnect(t1, t2, currentBoardState)) {
          possibleMoves.push({ tile1: t1, tile2: t2 });
        }
      }
    }
    if (possibleMoves.length === 0) {
      return false; 
    }
    possibleMoves.sort(() => 0.5 - Math.random());
    for (const move of possibleMoves) {
      const tile1Ref = currentBoardState[move.tile1.row][move.tile1.col];
      const tile2Ref = currentBoardState[move.tile2.row][move.tile2.col];
      tile1Ref.isMatched = true;
      tile2Ref.isMatched = true;
      if (solveBoardRecursively(currentBoardState, depth + 1)) {
        tile1Ref.isMatched = false;
        tile2Ref.isMatched = false;
        return true; 
      }
      tile1Ref.isMatched = false;
      tile2Ref.isMatched = false;
    }
    return false; 
  }, [canConnect]); 

  const generateBoardLayout = useCallback((): TileData[][] => {
    const tileValues: number[] = []; 
    for (let i = 0; i < NUM_UNIQUE_TILES; i++) {
      tileValues.push(i, i); 
    }
    for (let i = tileValues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tileValues[i], tileValues[j]] = [tileValues[j], tileValues[i]];
    }
    const ALL_ANIMAL_IMAGES = [
      "001-cat.png", "002-cow.png", "003-dog.png", "004-lion.png", "005-monkey.png", 
      "006-tiger.png", "007-giraffe.png", "008-crocodile.png", "009-zebra.png", "010-rabbit.png",
      "011-goat.png", "012-horse.png", "013-whale.png", "014-octopus.png", "015-elephant.png",
      "016-seal.png", "017-flamingo.png", "018-penguin.png", "019-leopard.png", "020-bear.png",
      "021-reindeer.png", "022-squirrel.png", "023-eagle.png", "024-ostrich.png", "025-frog.png",
      "026-raccoon.png", "027-tortoise.png", "028-hummingbird.png", "029-crab.png", "030-cheetah.png",
      "031-yak.png", "032-cougar.png", "033-shark.png", "034-beetle.png", "035-snail.png",
      "036-peacock.png", "037-ant.png", "038-pig.png", "039-orangutan.png", "040-jaguar.png",
      "041-chameleon.png", "042-seahorse.png", "043-turkey.png", "044-emu.png", "045-walrus.png",
      "046-black-panther.png", "047-hamster.png", "048-turtle.png", "049-panda-bear.png", "050-bison.png",
      "051-owl.png", "052-snake.png", "053-clown-fish.png", "054-platypus.png", "055-skunk.png",
      "056-deer.png", "057-otter.png", "058-kangaroo.png", "059-bee.png", "060-blue-tang-fish.png",
      "061-dolphin.png", "062-orca.png", "063-camel.png", "064-gorilla.png", "065-prawn.png",
      "066-toucan.png", "067-hedgehog.png", "068-rhinoceros.png", "069-anteater.png", "070-hippopotamus.png",
      "071-rat.png", "072-arctic-fox.png", "073-polar-bear.png", "074-guinea-pig.png", "075-wolf.png",
      "076-salmon.png", "077-kiwi.png", "078-sheep.png", "079-llama.png", "080-fox.png",
      "081-sugar-glider.png", "082-manta-ray.png", "083-mouse.png", "084-puffer-fish.png", "085-duck.png",
      "086-jellyfish.png", "087-pigeon.png", "088-chicken.png", "089-swan.png", "090-praying-mantis.png",
      "091-porcupine.png", "092-spider.png", "093-red-panda.png", "094-sloth.png", "095-koala.png",
      "096-lemur.png", "097-lobster.png", "098-ladybug.png", "099-starfish.png", "100-scorpion.png"
    ];
    if (ALL_ANIMAL_IMAGES.length < NUM_UNIQUE_TILES) {
      console.error("Not enough unique images available for the game board!");
      return [];
    }
    const shuffledImages = [...ALL_ANIMAL_IMAGES].sort(() => 0.5 - Math.random());
    const gameImageFilenames = shuffledImages.slice(0, NUM_UNIQUE_TILES);
    const valueToImagePathMap: { [key: number]: string } = {};
    gameImageFilenames.forEach((filename, index) => {
      valueToImagePathMap[index] = `/images/animals/${filename}`;
    });
    const newBoardLayout: TileData[][] = [];
    let tileIdCounter = 0;
    for (let r = 0; r < BOARD_ROWS; r++) {
      const row: TileData[] = [];
      for (let c = 0; c < BOARD_COLS; c++) {
        const currentTileValue = tileValues[r * BOARD_COLS + c];
        if (currentTileValue === undefined) continue;
        row.push({
          id: tileIdCounter++, value: currentTileValue,
          image: valueToImagePathMap[currentTileValue], 
          isMatched: false, isSelected: false, row: r, col: c,
        });
      }
      newBoardLayout.push(row);
    }
    return newBoardLayout;
  }, []); 

  const initializeBoard = useCallback(() => { 
    setIsLoadingBoard(true); // Set loading state
    setScore(0);
    setTimeRemaining(INITIAL_TIME);
    setIsGameOver(false);
    
    let newBoardAttempt: TileData[][];
    let layoutAttempts = 0;
    const MAX_LAYOUT_ATTEMPTS = 100; 
    let solverAttempts = 0;

    // This function will run in the main thread, potentially blocking UI.
    // For very long operations, consider a Web Worker or async chunks if possible.
    const findSolvableBoard = () => {
      while (true) { 
        layoutAttempts = 0;
        do { 
          newBoardAttempt = generateBoardLayout();
          if (newBoardAttempt.length === 0) {
            console.error("Board layout generation failed during solver loop.");
            if(layoutAttempts > MAX_LAYOUT_ATTEMPTS / 5) { 
               console.error("generateBoardLayout seems to be failing consistently. Stopping.");
               alert("棋盘布局生成严重失败，请刷新重试。");
               setIsGameOver(true); 
               setIsLoadingBoard(false);
               return;
            }
            layoutAttempts++; 
            continue; 
          }
          layoutAttempts++;
          if (layoutAttempts > MAX_LAYOUT_ATTEMPTS) {
            console.error("Failed to generate an initially solvable board (at least one move) after many attempts.");
            alert("无法生成有初始解的棋盘，请刷新重试。");
            setIsGameOver(true);
            setIsLoadingBoard(false);
            return; 
          }
        } while (!internalHasValidMove(newBoardAttempt));

        solverAttempts++;
        console.log(`Attempting to validate solvability of board (Solver attempt #${solverAttempts})`);
        
        const boardForSolver = newBoardAttempt.map(row => row.map(tile => ({...tile})));

        if (solveBoardRecursively(boardForSolver)) {
          console.log(`Fully solvable board found on solver attempt #${solverAttempts}.`);
          setBoard(newBoardAttempt); 
          setIsLoadingBoard(false);
          break; 
        } else {
          console.log(`Board from solver attempt #${solverAttempts} is not fully solvable. Retrying...`);
          if (solverAttempts > 0 && solverAttempts % 20 === 0) { // Reduced log frequency
              console.warn(`Solver has tried ${solverAttempts} times without finding a fully solvable board. This might take a very long time.`);
          }
        }
      }
    };
    
    // Run synchronously for now, as per user's "don't care about time"
    // If this blocks too much, it would need to be made async or moved to a worker.
    findSolvableBoard();

  }, [generateBoardLayout, internalHasValidMove, solveBoardRecursively]);

  useEffect(() => {
    initializeBoard(); 
    if (MUSIC_PLAYLIST.length > 0) {
      setCurrentSongIndex(Math.floor(Math.random() * MUSIC_PLAYLIST.length));
    }
  }, [initializeBoard]); 

  const handleTileClick = (id: number) => {
    if (isGameOver || isLoadingBoard) return; 
    let clickedTile: TileData | null = null;
    for (const row of board) {
      const found = row.find(tile => tile.id === id);
      if (found) {
        clickedTile = found;
        break;
      }
    }

    if (!clickedTile || clickedTile.isMatched || clickedTile.isSelected) {
      return;
    }

    if (!selectedTile) {
      setSelectedTile(clickedTile);
      updateTileSelectionState(clickedTile.id, true);
    } else {
      if (selectedTile.id === clickedTile.id) {
        updateTileSelectionState(selectedTile.id, false);
        setSelectedTile(null);
        return;
      }

      if (selectedTile.value === clickedTile.value && canConnect(selectedTile, clickedTile, board)) {
        markAsMatched(selectedTile.id, clickedTile.id);
        setSelectedTile(null);
      } else {
        updateTileSelectionState(selectedTile.id, false);
        setSelectedTile(clickedTile);
        updateTileSelectionState(clickedTile.id, true);
      }
    }
  };
  
  const updateTileSelectionState = (tileId: number, isSelected: boolean) => {
    setBoard(prevBoard =>
      prevBoard.map(row =>
        row.map(tile =>
          tile.id === tileId ? { ...tile, isSelected } : tile
        )
      )
    );
  };

  const markAsMatched = (id1: number, id2: number) => {
    setScore(prevScore => prevScore + 10);

    let nextBoardState = board.map(row =>
      row.map(tile => {
        if (tile.id === id1 || tile.id === id2) {
          return { ...tile, isMatched: true, isSelected: false };
        }
        return tile;
      })
    );

    const allTilesMatched = nextBoardState.every(row => row.every(tile => tile.isMatched));
    if (allTilesMatched) {
      console.log("Congratulations! Board Cleared!");
      setIsGameOver(true);
      setBoard(nextBoardState); 
      return; 
    }
    
    if (!internalHasValidMove(nextBoardState)) {
      console.warn("No more valid moves on the board after this match!");
      alert("棋盘上没有可消除的方块了，游戏结束！"); 
      setIsGameOver(true); 
    }
    
    setBoard(nextBoardState); 
  };

  useEffect(() => {
    if (audioRef.current && currentSongIndex !== -1 && MUSIC_PLAYLIST.length > 0) {
      audioRef.current.src = `/music/${MUSIC_PLAYLIST[currentSongIndex]}`;
      audioRef.current.loop = MUSIC_PLAYLIST.length === 1; 
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.warn("Music autoplay was prevented:", error);
        setIsPlaying(false); 
      });
    }
  }, [currentSongIndex]);

  const handleSongEnd = () => {
    if (audioRef.current && audioRef.current.loop) {
      setIsPlaying(true); 
      return;
    }
    playNextSong();
  };

  const playNextSong = () => {
    if (MUSIC_PLAYLIST.length === 0) return;
    if (MUSIC_PLAYLIST.length <= 1) { 
        if(audioRef.current) { 
            audioRef.current.currentTime = 0;
            audioRef.current.play().then(() => setIsPlaying(true)).catch(e => setIsPlaying(false));
        }
        return;
    }

    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * MUSIC_PLAYLIST.length);
    } while (nextIndex === currentSongIndex); 
    setCurrentSongIndex(nextIndex);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => console.warn("Play failed:", error));
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoadingBoard || board.length === 0) { // Updated loading condition
    return <div className="flex items-center justify-center min-h-screen text-2xl">正在生成保证可解的棋盘，请稍候...</div>;
  }

  return (
    <>
      <audio ref={audioRef} onEnded={handleSongEnd} />
      <div className="mb-4 text-2xl flex justify-around w-full max-w-md items-center">
        <div>Time: <span className={timeRemaining < 60 ? 'text-red-500 font-bold' : 'font-bold'}>{formatTime(timeRemaining)}</span></div>
        <div>Score: <span className="font-bold">{score}</span></div>
        {MUSIC_PLAYLIST.length > 0 && (
          <button 
            onClick={togglePlayPause}
            className="px-3 py-1 bg-green-500 hover:bg-green-700 text-white font-semibold rounded text-sm"
          >
            {isPlaying ? 'Pause Music' : 'Play Music'}
          </button>
        )}
      </div>
      {isGameOver && timeRemaining <=0 && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-10">
          <h2 className="text-4xl font-bold text-red-500 mb-4">Game Over!</h2>
          <p className="text-2xl mb-4">Your score: {score}</p>
          <button 
            onClick={initializeBoard} 
            className="px-6 py-3 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded text-xl"
          >
            Play Again
          </button>
        </div>
      )}
      <div 
        className={`grid gap-1 p-2 bg-gray-700 rounded-lg shadow-lg ${isGameOver ? 'opacity-50' : ''}`}
        style={{ 
          gridTemplateRows: `repeat(${BOARD_ROWS}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))`,
        width: 'fit-content' 
      }}
    >
      {board.map((row, rowIndex) =>
        row.map((tile) => (
          <Tile
            key={tile.id}
            id={tile.id}
            value={tile.value}
            image={tile.image}
            isSelected={tile.isSelected}
            isMatched={tile.isMatched}
            onClick={handleTileClick}
          />
        ))
      )}
    </div>
    </>
  );
};

export default Board;
