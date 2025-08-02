'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  size = 'md',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const containerSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`relative ${containerSizeClasses[size]}`}>
        {/* Outer spinning ring */}
        <div className={`${sizeClasses[size]} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}>
          <div className="w-full h-full border-2 border-samuel-off-white/20 rounded-full"></div>
          <div className="w-full h-full border-2 border-samuel-bright-red border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        
        {/* Inner pulsing dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-1 h-1 bg-samuel-bright-red rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {message && (
        <span className="text-samuel-off-white/80 text-sm animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
}