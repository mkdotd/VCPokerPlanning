import { cn } from "@/lib/utils";

interface VotingCardProps {
  value: string;
  displayValue?: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  suit?: string;
}

const cardColors: Record<string, string> = {
  "0": "from-blue-500 to-purple-600",
  "0.5": "from-cyan-500 to-blue-600",
  "1": "from-green-500 to-teal-600",
  "2": "from-yellow-500 to-orange-600",
  "3": "from-red-500 to-pink-600",
  "5": "from-purple-500 to-indigo-600",
  "8": "from-indigo-500 to-blue-600",
  "13": "from-teal-500 to-cyan-600",
  "pass": "from-gray-400 to-gray-600",
  "infinity": "from-black to-gray-800",
};

const suits = ["♠", "♥", "♦", "♣", "☕", "?"];

export function VotingCard({ 
  value, 
  displayValue, 
  isSelected, 
  onClick, 
  className,
  suit 
}: VotingCardProps) {
  const gradientClass = cardColors[value] || "from-gray-500 to-gray-600";
  const cardSuit = suit || suits[Math.floor(Math.random() * (suits.length - 2))];
  
  return (
    <div 
      className={cn(
        "relative group cursor-pointer transition-all duration-200",
        className
      )}
      onClick={onClick}
    >
      <div 
        className={cn(
          "aspect-[3/4] bg-gradient-to-br rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center text-white border-2 border-transparent hover:border-white/30",
          gradientClass,
          isSelected && "scale-105 shadow-xl border-white/50 transform -translate-y-2"
        )}
      >
        <div className="text-2xl font-bold mb-1 font-card">
          {displayValue || value}
        </div>
        <div className="text-xs opacity-75">
          {value === "pass" ? "☕" : value === "infinity" ? "?" : cardSuit}
        </div>
        
        {isSelected && (
          <div className="absolute -top-2 -right-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
            <i className="fas fa-check text-white text-xs"></i>
          </div>
        )}
      </div>
    </div>
  );
}
