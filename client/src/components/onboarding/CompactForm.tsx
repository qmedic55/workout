import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface CompactFormData {
  age: number;
  sex: "male" | "female";
  heightCm: number;
  currentWeightKg: number;
}

interface CompactFormProps {
  data: CompactFormData;
  onChange: (data: Partial<CompactFormData>) => void;
  errors?: Partial<Record<keyof CompactFormData, string>>;
  className?: string;
}

export function CompactForm({ data, onChange, errors, className }: CompactFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("space-y-4", className)}
    >
      {/* Age and Sex row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="age" className="text-sm">Age</Label>
          <Input
            id="age"
            type="number"
            value={data.age || ""}
            onChange={(e) => onChange({ age: parseInt(e.target.value) || 0 })}
            placeholder="45"
            min={18}
            max={120}
            className={cn(
              "h-11",
              errors?.age && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors?.age && (
            <p className="text-xs text-red-500">{errors.age}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Sex</Label>
          <RadioGroup
            value={data.sex}
            onValueChange={(value) => onChange({ sex: value as "male" | "female" })}
            className="flex gap-2 pt-1"
          >
            <div
              className={cn(
                "flex-1 flex items-center justify-center p-2.5 rounded-lg border cursor-pointer transition-colors",
                data.sex === "male"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              )}
              onClick={() => onChange({ sex: "male" })}
            >
              <RadioGroupItem value="male" id="male" className="sr-only" />
              <Label htmlFor="male" className="cursor-pointer text-sm">
                Male
              </Label>
            </div>
            <div
              className={cn(
                "flex-1 flex items-center justify-center p-2.5 rounded-lg border cursor-pointer transition-colors",
                data.sex === "female"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              )}
              onClick={() => onChange({ sex: "female" })}
            >
              <RadioGroupItem value="female" id="female" className="sr-only" />
              <Label htmlFor="female" className="cursor-pointer text-sm">
                Female
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Height and Weight row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="height" className="text-sm">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            value={data.heightCm || ""}
            onChange={(e) => onChange({ heightCm: parseFloat(e.target.value) || 0 })}
            placeholder="170"
            min={100}
            max={250}
            className={cn(
              "h-11",
              errors?.heightCm && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors?.heightCm && (
            <p className="text-xs text-red-500">{errors.heightCm}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="weight" className="text-sm">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={data.currentWeightKg || ""}
            onChange={(e) => onChange({ currentWeightKg: parseFloat(e.target.value) || 0 })}
            placeholder="80"
            min={30}
            max={300}
            className={cn(
              "h-11",
              errors?.currentWeightKg && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors?.currentWeightKg && (
            <p className="text-xs text-red-500">{errors.currentWeightKg}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
