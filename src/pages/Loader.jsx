export const Loader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
    <div className="flex flex-col items-center justify-center gap-10">
      {/* Professional Medical Logo Container */}
      <div className="relative">
        {/* Background pulse effect */}
        <div className="absolute -inset-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full animate-pulse-slow"></div>
        
        {/* Main medical symbol with precision animation */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-32 h-32 rounded-full border-4 border-blue-100 flex items-center justify-center">
            {/* Inner ring with spinning segments */}
            <div className="relative w-24 h-24">
              {/* Spinning medical cross segments */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center justify-center">
                  {/* Vertical cross part */}
                  <div className="relative">
                    <div className="w-2 h-16 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full animate-pulse vertical-glow"></div>
                    {/* Top segment animation */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-1 h-8 bg-blue-400 rounded-full animate-float-up"></div>
                    {/* Bottom segment animation */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-1 h-8 bg-blue-400 rounded-full animate-float-down"></div>
                  </div>
                  
                  {/* Horizontal cross part */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-16 h-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full animate-pulse horizontal-glow"></div>
                    {/* Left segment animation */}
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-1 bg-blue-400 rounded-full animate-float-left"></div>
                    {/* Right segment animation */}
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-1 bg-blue-400 rounded-full animate-float-right"></div>
                  </div>
                </div>
              </div>
              
              {/* Rotating circle indicator */}
              <div className="absolute inset-0">
                <div className="w-full h-full animate-spin-slow">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status indicator dots */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-dot-pulse"
                style={{ animationDelay: `${dot * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Text content with professional typography */}
      <div className="text-center space-y-4">
        {/* Main title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            Patient Management System
          </h2>
          <div className="h-px w-16 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto"></div>
        </div>
        
        {/* Subtitle with subtle animation */}
        <p className="text-gray-600 font-medium tracking-wide text-sm uppercase letter-spacing">
          Initializing Application
        </p>
        
        {/* Progress indicator */}
        <div className="pt-6">
          <div className="flex items-center justify-center gap-4">
            {/* Loading text with typing effect */}
            <span className="text-sm text-gray-500 font-medium tracking-wide">
              Loading
            </span>
            
            {/* Elegant progress dots */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-blue-400 rounded-full animate-dot-wave"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            
            <span className="text-sm text-gray-500 font-medium tracking-wide">
              modules
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 w-48">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-progress-scan"></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">0%</span>
              <span className="text-xs text-gray-400">100%</span>
            </div>
          </div>
        </div>
        
        {/* Status messages */}
        <div className="pt-8 space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>Secure connection established</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <span>Loading patient database</span>
          </div>
        </div>
      </div>

      {/* Copyright / Version */}
      <div className="absolute bottom-8 text-xs text-gray-400">
        v2.1.4 • Patient Management System
      </div>
    </div>

    <style jsx>{`
      @keyframes spin-slow {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      
      @keyframes pulse-slow {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 0.9; }
      }
      
      @keyframes dot-pulse {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }
      
      @keyframes dot-wave {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
        30% { transform: translateY(-4px); opacity: 1; }
      }
      
      @keyframes progress-scan {
        0% { transform: translateX(-100%); width: 30%; }
        50% { transform: translateX(100%); width: 10%; }
        100% { transform: translateX(300%); width: 30%; }
      }
      
      @keyframes float-up {
        0%, 100% { transform: translateY(0); opacity: 0.5; }
        50% { transform: translateY(-2px); opacity: 1; }
      }
      
      @keyframes float-down {
        0%, 100% { transform: translateY(0); opacity: 0.5; }
        50% { transform: translateY(2px); opacity: 1; }
      }
      
      @keyframes float-left {
        0%, 100% { transform: translateX(0); opacity: 0.5; }
        50% { transform: translateX(-2px); opacity: 1; }
      }
      
      @keyframes float-right {
        0%, 100% { transform: translateX(0); opacity: 0.5; }
        50% { transform: translateX(2px); opacity: 1; }
      }
      
      @keyframes vertical-glow {
        0%, 100% { box-shadow: 0 0 10px rgba(37, 99, 235, 0.3); }
        50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.6); }
      }
      
      @keyframes horizontal-glow {
        0%, 100% { box-shadow: 0 0 10px rgba(6, 182, 212, 0.3); }
        50% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.6); }
      }
      
      .animate-spin-slow {
        animation: spin-slow 4s linear infinite;
      }
      
      .animate-pulse-slow {
        animation: pulse-slow 2s ease-in-out infinite;
      }
      
      .animate-dot-pulse {
        animation: dot-pulse 1.5s ease-in-out infinite;
      }
      
      .animate-dot-wave {
        animation: dot-wave 1.5s ease-in-out infinite;
      }
      
      .animate-progress-scan {
        animation: progress-scan 2s ease-in-out infinite;
      }
      
      .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .animate-float-up {
        animation: float-up 1.5s ease-in-out infinite;
      }
      
      .animate-float-down {
        animation: float-down 1.5s ease-in-out infinite;
      }
      
      .animate-float-left {
        animation: float-left 1.5s ease-in-out infinite;
      }
      
      .animate-float-right {
        animation: float-right 1.5s ease-in-out infinite;
      }
      
      .vertical-glow {
        animation: vertical-glow 1.5s ease-in-out infinite;
      }
      
      .horizontal-glow {
        animation: horizontal-glow 1.5s ease-in-out infinite;
      }
      
      .letter-spacing {
        letter-spacing: 0.1em;
      }
    `}</style>
  </div>
);