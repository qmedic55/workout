import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Watch,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Link2,
  Unlink,
  Info,
} from "lucide-react";
import { SiApple, SiFitbit, SiGarmin } from "react-icons/si";
import type { WearableConnection } from "@shared/schema";

interface DeviceInfo {
  id: string;
  name: string;
  provider: string;
  icon: React.ReactNode;
  description: string;
  dataTypes: string[];
  color: string;
}

const devices: DeviceInfo[] = [
  {
    id: "apple_health",
    name: "Apple Health",
    provider: "apple_health",
    icon: <SiApple className="h-8 w-8" />,
    description: "Connect to Apple Health for steps, heart rate, sleep, HRV, and workout data from your iPhone or Apple Watch.",
    dataTypes: ["Steps", "Heart Rate", "Sleep", "HRV", "Workouts", "Active Energy"],
    color: "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    provider: "fitbit",
    icon: <SiFitbit className="h-8 w-8" />,
    description: "Sync your Fitbit data including activity, sleep stages, heart rate zones, and SpO2 readings.",
    dataTypes: ["Steps", "Heart Rate", "Sleep Stages", "SpO2", "Stress Score", "Active Minutes"],
    color: "bg-[#00B0B9] text-white",
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    provider: "garmin",
    icon: <SiGarmin className="h-8 w-8" />,
    description: "Import training data, Body Battery, stress levels, and detailed workout metrics from Garmin devices.",
    dataTypes: ["Steps", "Heart Rate", "Sleep", "Body Battery", "Stress", "Training Load"],
    color: "bg-black text-white",
  },
  {
    id: "oura",
    name: "Oura Ring",
    provider: "oura",
    icon: <Watch className="h-8 w-8" />,
    description: "Get detailed sleep scores, readiness data, HRV trends, and recovery metrics from your Oura Ring.",
    dataTypes: ["Sleep Score", "Readiness", "HRV", "Body Temperature", "Activity", "Recovery"],
    color: "bg-gradient-to-r from-gray-700 to-gray-900 text-white",
  },
];

function DeviceCard({ device, connection, onConnect, onDisconnect, isPending }: {
  device: DeviceInfo;
  connection?: WearableConnection;
  onConnect: () => void;
  onDisconnect: () => void;
  isPending: boolean;
}) {
  const isConnected = connection?.isConnected;
  const lastSync = connection?.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString() : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className={`p-3 rounded-xl ${device.color}`}>
            {device.icon}
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge className="bg-chart-1/10 text-chart-1 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-lg mt-3" data-testid={`text-device-${device.id}`}>{device.name}</CardTitle>
        <CardDescription>{device.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {device.dataTypes.map((type) => (
            <Badge key={type} variant="outline" className="text-xs">
              {type}
            </Badge>
          ))}
        </div>

        {lastSync && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Last synced: {lastSync}
          </p>
        )}

        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onDisconnect}
                disabled={isPending}
                data-testid={`button-disconnect-${device.id}`}
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={isPending}
                data-testid={`button-sync-${device.id}`}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              className="flex-1"
              onClick={onConnect}
              disabled={isPending}
              data-testid={`button-connect-${device.id}`}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Connect {device.name}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DevicesSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-64" />
      ))}
    </div>
  );
}

export default function Devices() {
  const { toast } = useToast();
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const { data: connections = [], isLoading } = useQuery<WearableConnection[]>({
    queryKey: ["/api/wearables"],
  });

  // Show "Coming Soon" dialog instead of actual connection
  const handleConnect = (provider: string) => {
    const device = devices.find(d => d.provider === provider);
    setSelectedDevice(device?.name || provider);
    setComingSoonOpen(true);
  };

  // Keep the mutation for potential future use, but it's not called by handleConnect
  const connectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", "/api/wearables/connect", { provider });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wearables"] });
      if (data.authUrl) {
        window.open(data.authUrl, "_blank");
      }
      toast({
        title: "Connection Initiated",
        description: "Please complete the authorization in the new window.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      await apiRequest("POST", "/api/wearables/disconnect", { provider });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wearables"] });
      toast({
        title: "Disconnected",
        description: "Device has been disconnected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getConnection = (provider: string) => 
    connections.find(c => c.provider === provider);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connected Devices</h1>
        <p className="text-muted-foreground">
          Connect your wearables and fitness trackers to automatically sync health data.
        </p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">How Device Syncing Works</p>
              <p className="text-sm text-muted-foreground mt-1">
                When you connect a device, VitalPath will automatically import your health data including steps, 
                sleep, heart rate, and more. This data helps your AI mentor provide more personalized guidance 
                and track your progress more accurately. You can disconnect at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <DevicesSkeleton />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              connection={getConnection(device.provider)}
              onConnect={() => handleConnect(device.provider)}
              onDisconnect={() => disconnectMutation.mutate(device.provider)}
              isPending={disconnectMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Coming Soon Dialog */}
      <Dialog open={comingSoonOpen} onOpenChange={setComingSoonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coming Soon!</DialogTitle>
            <DialogDescription className="pt-2">
              {selectedDevice} integration is currently under development. We're working hard to bring you
              seamless wearable connectivity so you can automatically sync your health data.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            In the meantime, you can manually enter your data through the Daily Log feature to track your progress.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setComingSoonOpen(false)}>
              Got it
            </Button>
            <Button asChild>
              <a href="/daily-log">Go to Daily Log</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Manual Data Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Don't have a wearable device? No problem! You can manually enter your data through our Daily Log feature.
            Track weight, sleep, steps, and biofeedback metrics without any connected devices.
          </p>
          <Button variant="outline" asChild>
            <a href="/daily-log" data-testid="link-daily-log">
              Go to Daily Log
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
