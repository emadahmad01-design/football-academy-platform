import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  title: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function PhotoModal({ 
  isOpen, 
  onClose, 
  src, 
  title, 
  onPrevious, 
  onNext,
  hasPrevious = false,
  hasNext = false
}: PhotoModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
      onPrevious();
    } else if (e.key === "ArrowRight" && hasNext && onNext) {
      onNext();
    }
  }, [onClose, onPrevious, onNext, hasPrevious, hasNext]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95" />
      
      {/* Content */}
      <div 
        className="relative z-10 w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <a 
              href={src} 
              download 
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Close (ESC)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          {/* Previous Button */}
          {hasPrevious && onPrevious && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
              className="absolute left-4 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {/* Image */}
          <img
            src={src}
            alt={title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />

          {/* Next Button */}
          {hasNext && onNext && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-4 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-white/60 text-sm">
          Press ESC to close • Use arrow keys to navigate
        </div>
      </div>
    </div>
  );
}
