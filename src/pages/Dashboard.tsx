import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Sprout, CheckSquare, TrendingUp, Camera, Users, Calendar } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const farms = useQuery(api.farms.list);
  const pendingTasks = useQuery(api.tasks.listPending);
  const seedData = useAction(api.seed.seedUserData);
  const nextTask = pendingTasks && pendingTasks.length > 0 ? pendingTasks[0] : null;

  const handleSeedData = async () => {
    try {
      await seedData();
      toast.success("Sample data created successfully!");
    } catch {
      toast.error("Failed to create sample data");
    }
  };

  const farmCount = farms?.length || 0;
  const taskCount = pendingTasks?.length || 0;

  return (
    <AppShell title="Dashboard">
      <div className="p-4 space-y-6">

        {/* Page Header redesigned like reference: brand left, nav center, CTA right */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Brand -> go to Landing */}
          <Button
            variant="ghost"
            className="rounded-2xl px-3 py-2 font-semibold"
            onClick={() => navigate("/")}
          >
            <img
              src="https://harmless-tapir-303.convex.cloud/api/storage/a4af3a5d-e126-420d-b31d-c1929a3c833b"
              alt="Root AI"
              className="h-6 w-6 mr-2 rounded-full object-cover"
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                if (t.src !== '/logo.svg') t.src = '/logo.svg';
                t.onerror = null;
              }}
            />
            Root AI
          </Button>

          {/* Right: CTA */}
          <Button
            className="rounded-full bg-[oklch(0.42_0.12_130)] hover:bg-[oklch(0.42_0.12_130_/_90%)] text-white"
            onClick={() => navigate("/learn")}
          >
            Learn More →
          </Button>
        </div>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, Farmer! 🌾
          </h2>
          <p className="text-muted-foreground">
            Let's check on your farming progress today
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="cursor-pointer" onClick={() => navigate("/my-farm")}>
              <CardContent className="p-4 text-center">
                <Sprout className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{farmCount}</div>
                <div className="text-sm text-muted-foreground">Farms</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="cursor-pointer" onClick={() => navigate("/tasks")}>
              <CardContent className="p-4 text-center">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{taskCount}</div>
                <div className="text-sm text-muted-foreground">Pending Tasks</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Next Task */}
        {nextTask && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Next Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium">{nextTask.title}</div>
                {nextTask.dueDate && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Due: {new Date(nextTask.dueDate).toLocaleDateString()}
                  </div>
                )}
                {nextTask.notes && (
                  <div className="text-sm mt-2">{nextTask.notes}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/soil-test")}
              >
                <Camera className="h-4 w-4 mr-2" />
                Test Soil Quality
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/market")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Check Market Prices
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/community")}
              >
                <Users className="h-4 w-4 mr-2" />
                Connect with Farmers
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sample Data Button (for demo) */}
        {farmCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  No data yet? Try our sample data to explore the app!
                </p>
                <Button onClick={handleSeedData}>
                  Create Sample Data
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}