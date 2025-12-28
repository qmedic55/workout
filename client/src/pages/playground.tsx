import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Playground() {
  const { toast } = useToast();
  const [checked, setChecked] = useState<boolean>(true);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Component Playground</h1>
        <p className="text-muted-foreground">
          Quick, in-app preview of the reusable UI components in <code>client/src/components/ui</code>.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Variants + a toast demo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                toast({
                  title: "Hello!",
                  description: "This toast was triggered from the playground.",
                })
              }
            >
              Show toast
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="ghost" className="underline">Link</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Basic form controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="you@example.com" />
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
              />
              <Label htmlFor="terms">Accept terms</Label>
              {checked ? <Badge>Checked</Badge> : <Badge variant="secondary">Unchecked</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select + Tabs</CardTitle>
          <CardDescription>Common interactive components.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-sm space-y-2">
            <Label>Theme preference</Label>
            <Select defaultValue="system">
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="one" className="w-full">
            <TabsList>
              <TabsTrigger value="one">Tab One</TabsTrigger>
              <TabsTrigger value="two">Tab Two</TabsTrigger>
            </TabsList>
            <TabsContent value="one" className="mt-4">
              <div className="text-sm text-muted-foreground">
                Put any component composition here to preview it quickly.
              </div>
            </TabsContent>
            <TabsContent value="two" className="mt-4">
              <div className="text-sm text-muted-foreground">Second tab content.</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}






