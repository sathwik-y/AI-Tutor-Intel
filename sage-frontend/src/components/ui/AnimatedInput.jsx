import { useState, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

const AnimatedInput = ({ 
  value, 
  onChange, 
  placeholder, 
  className = '', 
  containerClass = '', 
  onKeyPress,
  rows = 3,
  isTextarea = true,
  ...props 
}) => {
  const inputContainerRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const radius = 350;

  const handleMouseMove = useCallback((e) => {
    if (!inputContainerRef.current) return;
    
    const rect = inputContainerRef.current.getBoundingClientRect();
    setMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const containerBg = `
    radial-gradient(
      ${visible ? radius + "px" : "0px"} circle at ${mouse.x}px ${mouse.y}px,
      rgba(1, 235, 252, 0.6),
      rgba(1, 235, 252, 0.4) 45%,
      rgba(1, 235, 252, 0.2) 65%,
      rgba(1, 235, 252, 0.1) 85%,
      transparent 95%
    )
  `;

  const InputComponent = isTextarea ? 'textarea' : 'input';

  return (
    <div
      ref={inputContainerRef}
      className={cn(
        'group/input rounded-lg p-[4px] transition duration-300 w-full',
        containerClass
      )}
      style={{
        background: containerBg,
      }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={handleMouseMove}
    >
      <InputComponent
        {...props}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        rows={isTextarea ? rows : undefined}
        className={cn(
          `flex w-full border-none bg-gray-700 text-white shadow-input rounded-md px-4 py-4 text-sm
          file:border-0 file:bg-transparent file:text-sm file:font-medium 
          placeholder:text-neutral-400 
          focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cyan-400
          disabled:cursor-not-allowed disabled:opacity-50
          group-hover/input:shadow-none transition duration-400 resize-none`,
          isTextarea ? 'min-h-[120px]' : 'h-14',
          className
        )}
      />
    </div>
  );
};

export default AnimatedInput;
