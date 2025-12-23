import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Camera, ScanBarcode, Search, X } from "lucide-react";
import { PhotoFoodLogger } from "@/components/photo-food-logger";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { cn } from "@/lib/utils";

interface FoodFABProps {
  date?: string;
  className?: string;
  onManualEntry?: () => void;
}

export function FoodFAB({ date, className, onManualEntry }: FoodFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [photoLoggerOpen, setPhotoLoggerOpen] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);

  const handleFoodSelect = (food: {
    name: string;
    servingSize: string | null;
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatGrams: number | null;
  }) => {
    // For barcode, we'll need to trigger manual entry with pre-filled data
    // For now, just close the scanner and let them know to use nutrition page
    setBarcodeScannerOpen(false);
    onManualEntry?.();
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "fixed bottom-24 right-4 md:bottom-6 h-14 w-14 rounded-full shadow-lg z-40",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-transform duration-200",
              isOpen && "rotate-45",
              className
            )}
            data-testid="food-fab"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          className="w-48 mb-2"
          sideOffset={8}
        >
          <DropdownMenuItem
            onClick={() => {
              setPhotoLoggerOpen(true);
              setIsOpen(false);
            }}
            className="cursor-pointer"
          >
            <Camera className="h-4 w-4 mr-2 text-primary" />
            Photo AI
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setBarcodeScannerOpen(true);
              setIsOpen(false);
            }}
            className="cursor-pointer"
          >
            <ScanBarcode className="h-4 w-4 mr-2" />
            Scan Barcode
          </DropdownMenuItem>
          {onManualEntry && (
            <DropdownMenuItem
              onClick={() => {
                onManualEntry();
                setIsOpen(false);
              }}
              className="cursor-pointer"
            >
              <Search className="h-4 w-4 mr-2" />
              Search Foods
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Photo Food Logger */}
      <PhotoFoodLogger
        open={photoLoggerOpen}
        onOpenChange={setPhotoLoggerOpen}
        date={date}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={barcodeScannerOpen}
        onOpenChange={setBarcodeScannerOpen}
        onProductSelect={handleFoodSelect}
      />
    </>
  );
}
