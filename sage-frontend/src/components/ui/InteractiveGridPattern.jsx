import { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';

const InteractiveGridPattern = ({
  className = '',
  squaresClassName = '',
  width = 40,
  height = 40,
  squares = [24, 24],
  ...props
}) => {
  const [hoveredSquare, setHoveredSquare] = useState(null);

  const horizontal = squares[0];
  const vertical = squares[1];
  const totalSquares = horizontal * vertical;
  const gridWidth = width * horizontal;
  const gridHeight = height * vertical;

  const getX = (index) => (index % horizontal) * width;
  const getY = (index) => Math.floor(index / horizontal) * height;

  const svgClass = useMemo(() =>
    cn("absolute inset-0 h-full w-full border border-gray-400/30", className),
    [className]
  );

  const getRectClass = (index) => {
    return cn(
      "stroke-gray-400/30 transition-all duration-100 ease-in-out [&:not(:hover)]:duration-1000",
      hoveredSquare === index ? "fill-gray-400/40" : "fill-transparent",
      squaresClassName,
    );
  };

  const handleMouseEnter = (index) => {
    setHoveredSquare(index);
  };

  const handleMouseLeave = () => {
    setHoveredSquare(null);
  };

  return (
    <svg
      width={gridWidth}
      height={gridHeight}
      className={svgClass}
      {...props}
    >
      {Array.from({ length: totalSquares }, (_, index) => (
        <rect
          key={index}
          x={getX(index)}
          y={getY(index)}
          width={width}
          height={height}
          className={getRectClass(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
        />
      ))}
    </svg>
  );
};

export default InteractiveGridPattern;
