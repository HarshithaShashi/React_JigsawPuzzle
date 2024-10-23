import React, { useState, useEffect } from 'react';

const PuzzleGame = () => {
  const [image, setImage] = useState(null);
  const [blurredImage, setBlurredImage] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [draggedPieceIndex, setDraggedPieceIndex] = useState(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCompleted, setIsCompleted] = useState(false);
  
  const numRows = 3;
  const numCols = 4;
  const tolerance = 20;
  
  // Maximum size for the puzzle canvas
  const maxCanvasWidth = 800;
  const maxCanvasHeight = 600;

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let scaledWidth = img.width;
        let scaledHeight = img.height;

        // Scale down the image to fit within the maximum canvas size
        if (scaledWidth > maxCanvasWidth || scaledHeight > maxCanvasHeight) {
          const scale = Math.min(
            maxCanvasWidth / scaledWidth,
            maxCanvasHeight / scaledHeight
          );
          scaledWidth *= scale;
          scaledHeight *= scale;
        }

        setImage(img);
        setCanvasWidth(scaledWidth);
        setCanvasHeight(scaledHeight);

        // Create blurred background
        const blurredCanvas = document.createElement('canvas');
        const blurredContext = blurredCanvas.getContext('2d');
        blurredCanvas.width = scaledWidth;
        blurredCanvas.height = scaledHeight;

        blurredContext.filter = 'blur(10px)';
        blurredContext.drawImage(img, 0, 0, scaledWidth, scaledHeight);
        setBlurredImage(blurredCanvas.toDataURL());
      };
    };
    reader.readAsDataURL(file);
  };

  // Shuffle puzzle pieces
  const shufflePieces = () => {
    const shuffledPieces = pieces.map((piece) => ({
      ...piece,
      currentX: Math.random() * (canvasWidth - piece.width),
      currentY: Math.random() * (canvasHeight - piece.height),
    }));
    setPieces(shuffledPieces);
  };

  // Cut the image into pieces
  const cutImageIntoPieces = (img) => {
    const pieceWidth = canvasWidth / numCols;
    const pieceHeight = canvasHeight / numRows;
    let newPieces = [];

    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = pieceWidth;
        canvas.height = pieceHeight;

        context.drawImage(
          img,
          x * (img.width / numCols), y * (img.height / numRows), (img.width / numCols), (img.height / numRows), // Use full image size for source
          0, 0, pieceWidth, pieceHeight // Draw in scaled size
        );

        newPieces.push({
          imageData: canvas.toDataURL(),
          correctX: x * pieceWidth,
          correctY: y * pieceHeight,
          currentX: Math.random() * (canvasWidth - pieceWidth),
          currentY: Math.random() * (canvasHeight - pieceHeight),
          isPlacedCorrectly: false,
          width: pieceWidth,
          height: pieceHeight,
        });
      }
    }

    setPieces(newPieces);
    setIsCompleted(false); // Reset completion state
  };

  // When the image is uploaded, cut it into pieces
  useEffect(() => {
    if (image) {
      cutImageIntoPieces(image);
    }
  }, [image, canvasWidth, canvasHeight]);

  // Check if all pieces are correctly placed
  useEffect(() => {
    const allCorrect = pieces.every((piece) => piece.isPlacedCorrectly);
    if (allCorrect && pieces.length > 0) {
      setIsCompleted(true);
      alert("Congratulations! You've completed the puzzle!");
    }
  }, [pieces]);

  const handleDragStart = (index, e) => {
    const piece = pieces[index];
    const offsetX = e.clientX - piece.currentX;
    const offsetY = e.clientY - piece.currentY;
    setDragOffset({ x: offsetX, y: offsetY });
    setDraggedPieceIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    if (draggedPieceIndex !== null) {
      const updatedPieces = [...pieces];
      const draggedPiece = updatedPieces[draggedPieceIndex];

      const dropX = e.clientX - dragOffset.x;
      const dropY = e.clientY - dragOffset.y;

      if (
        Math.abs(dropX - draggedPiece.correctX) < tolerance &&
        Math.abs(dropY - draggedPiece.correctY) < tolerance
      ) {
        draggedPiece.currentX = draggedPiece.correctX;
        draggedPiece.currentY = draggedPiece.correctY;
        draggedPiece.isPlacedCorrectly = true;
      } else {
        draggedPiece.currentX = dropX;
        draggedPiece.currentY = dropY;
      }

      setPieces(updatedPieces);
      setDraggedPieceIndex(null);
    }
  };

  return (
    <div>
      <h1>Puzzle Game</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <button onClick={shufflePieces} disabled={!image || isCompleted}>
        Shuffle Pieces
      </button>
      <button onClick={() => cutImageIntoPieces(image)} disabled={!image}>
        Reset Puzzle
      </button>
      <div
        style={{
          position: 'relative',
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          border: '2px solid black',
          margin: '20px auto',
          overflow: 'hidden',
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {blurredImage && (
          <img
            src={blurredImage}
            alt="Blurred Puzzle"
            style={{
              position: 'absolute',
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              zIndex: 0,
              top: 0,
              left: 0,
            }}
          />
        )}
        {pieces.map((piece, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(index, e)}
            style={{
              cursor: 'grab',
              width: `${piece.width}px`,
              height: `${piece.height}px`,
              position: 'absolute',
              top: `${piece.currentY}px`,
              left: `${piece.currentX}px`,
              zIndex: 1,
              opacity: piece.isPlacedCorrectly ? 0.5 : 1,
              border: draggedPieceIndex === index ? '2px solid red' : 'none',
              transition: piece.isPlacedCorrectly ? 'opacity 0.5s' : 'none',
            }}
          >
            <img src={piece.imageData} alt={`Puzzle piece ${index}`} width="100%" height="100%" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PuzzleGame;