export const Loader = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Main spinner with gradient and shadow */}
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-[3px] border-purple-500/20 border-t-transparent"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="animate-pulse">
              <svg 
                className="w-8 h-8 text-purple-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>
  
        {/* Animated text with fade effect */}
        <div className="text-center space-y-2">
          <h3 className="animate-pulse text-xl font-semibold text-gray-800 font-[Poppins]">
            Clinic Management System
          </h3>
          <p className="animate-fade-in text-gray-500 text-sm font-medium">
            Initializing Your Application
          </p>
        </div>
  
        {/* Progress dots */}
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
  
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1.2s linear infinite;
        }
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );