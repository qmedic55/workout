import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, Check, AlertCircle, Loader2 } from "lucide-react";

interface BarcodeProduct {
  name: string;
  brand: string | null;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  imageUrl: string | null;
  isPer100g: boolean;
}

interface BarcodeLookupResult {
  found: boolean;
  barcode: string;
  product?: BarcodeProduct;
  message?: string;
}

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (product: {
    name: string;
    servingSize: string | null;
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatGrams: number | null;
  }) => void;
}

export function BarcodeScanner({ open, onOpenChange, onProductSelect }: BarcodeScannerProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lookupMutation = useMutation({
    mutationFn: async (barcode: string): Promise<BarcodeLookupResult> => {
      const response = await apiRequest("POST", "/api/barcode/lookup", { barcode });
      return response.json();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      setCameraError(null);
      setScanning(true);
      setScannedBarcode(null);

      const scanner = new Html5Qrcode("barcode-scanner-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        async (decodedText) => {
          // Barcode detected
          setScannedBarcode(decodedText);
          setScanning(false);

          // Stop the scanner
          await scanner.stop();

          // Look up the product
          lookupMutation.mutate(decodedText);
        },
        () => {
          // Scan error - ignore (no barcode in frame)
        }
      );
    } catch (error: any) {
      console.error("Scanner error:", error);
      setScanning(false);

      if (error.message?.includes("Permission") || error.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access to scan barcodes.");
      } else if (error.message?.includes("NotFoundError") || error.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Failed to start camera. Please try again.");
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleClose = async () => {
    await stopScanner();
    setScannedBarcode(null);
    lookupMutation.reset();
    setCameraError(null);
    onOpenChange(false);
  };

  const handleSelectProduct = (product: BarcodeProduct) => {
    const displayName = product.brand
      ? `${product.name} (${product.brand})`
      : product.name;

    onProductSelect({
      name: displayName,
      servingSize: product.servingSize,
      calories: product.calories,
      proteinGrams: product.protein,
      carbsGrams: product.carbs,
      fatGrams: product.fat,
    });

    handleClose();
    toast({
      title: "Product added",
      description: `${displayName} has been added to the form.`,
    });
  };

  const handleScanAgain = async () => {
    setScannedBarcode(null);
    lookupMutation.reset();
    await startScanner();
  };

  // Start scanner when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a food product barcode to look up nutrition info.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner view */}
          {scanning && !scannedBarcode && (
            <div className="relative">
              <div
                id="barcode-scanner-container"
                ref={containerRef}
                className="w-full aspect-video rounded-lg overflow-hidden bg-black"
              />
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <Badge variant="secondary" className="bg-black/70 text-white">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Scanning...
                </Badge>
              </div>
            </div>
          )}

          {/* Camera error */}
          {cameraError && (
            <Card className="border-destructive">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
                <p className="text-sm text-destructive mb-4">{cameraError}</p>
                <Button variant="outline" onClick={() => startScanner()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading lookup */}
          {scannedBarcode && lookupMutation.isPending && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Looking up barcode {scannedBarcode}...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product found */}
          {lookupMutation.data?.found && lookupMutation.data.product && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-4">
                  {lookupMutation.data.product.imageUrl && (
                    <img
                      src={lookupMutation.data.product.imageUrl}
                      alt={lookupMutation.data.product.name}
                      className="w-20 h-20 object-contain rounded-lg bg-muted"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{lookupMutation.data.product.name}</h4>
                    {lookupMutation.data.product.brand && (
                      <p className="text-sm text-muted-foreground truncate">
                        {lookupMutation.data.product.brand}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-1">
                      {lookupMutation.data.product.servingSize}
                      {lookupMutation.data.product.isPer100g && " (per 100g)"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted">
                    <p className="text-lg font-semibold">{lookupMutation.data.product.calories}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <p className="text-lg font-semibold">{lookupMutation.data.product.protein}g</p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <p className="text-lg font-semibold">{lookupMutation.data.product.carbs}g</p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <p className="text-lg font-semibold">{lookupMutation.data.product.fat}g</p>
                    <p className="text-xs text-muted-foreground">Fat</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleScanAgain} className="flex-1">
                    Scan Again
                  </Button>
                  <Button
                    onClick={() => handleSelectProduct(lookupMutation.data!.product!)}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Use This
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product not found */}
          {lookupMutation.data && !lookupMutation.data.found && (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h4 className="font-medium mb-1">Product Not Found</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Barcode {lookupMutation.data.barcode} is not in our database. Try entering the
                  nutrition info manually.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={handleScanAgain}>
                    Scan Again
                  </Button>
                  <Button variant="ghost" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancel button */}
          {!scannedBarcode && !cameraError && (
            <Button variant="outline" onClick={handleClose} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
