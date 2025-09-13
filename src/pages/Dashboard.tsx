import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Sprout, CheckSquare, Calendar, TrendingUp, Camera, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const navigate = useNavigate();
  const profile = useQuery(api.profiles.get);
  const farms = useQuery(api.farms.list);
  const pendingTasks = useQuery(api.tasks.listPending);
  const seedData = useAction(api.seed.seedUserData);
  const sim = useQuery(api.sims.get);
  const advance = useMutation(api.sims.advanceTick);
  const plant = useMutation(api.sims.plantCrop);
  const water = useMutation(api.sims.water);
  const harvest = useMutation(api.sims.harvest);

  // Ensure a simulation exists on first load
  const ensureSim = useMutation(api.sims.ensure);
  useEffect(() => {
    if (sim === null) {
      ensureSim({}).catch(() => {});
    }
  }, [sim, ensureSim]);

  const handleSeedData = async () => {
    try {
      await seedData();
      toast.success("Sample data created successfully!");
    } catch (error) {
      toast.error("Failed to create sample data");
    }
  };

  const advanceDay = async () => {
    try {
      await advance({});
      toast.success("Advanced one day");
    } catch {
      toast.error("Failed to advance day");
    }
  };

  const plantCrop = async (crop: string) => {
    try {
      await plant({ crop });
      toast.success(`Planted ${crop}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to plant");
    }
  };

  const waterField = async () => {
    try {
      await water({});
      toast.success("Field watered");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to water");
    }
  };

  const doHarvest = async () => {
    try {
      const res = await harvest({});
      const gained = (res as any)?.payout ?? 0;
      toast.success(`Harvested! Earned ₹${gained}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to harvest");
    }
  };

  const nextTask = pendingTasks?.[0];
  const farmCount = farms?.length || 0;
  const taskCount = pendingTasks?.length || 0;

  return (
    <AppShell title="Dashboard">
      <div className="p-4 space-y-6">
        {/* Simulation/Game Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5" />
                Farm Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!sim ? (
                <div className="text-sm text-muted-foreground">Preparing your simulation...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Season:</span> {sim.season}</div>
                    <div><span className="text-muted-foreground">Weather:</span> {sim.weather}</div>
                    <div><span className="text-muted-foreground">Soil Moisture:</span> {sim.soilMoisture}%</div>
                    <div><span className="text-muted-foreground">Stage:</span> {sim.stage}</div>
                    <div><span className="text-muted-foreground">Crop:</span> {sim.crop ?? "—"}</div>
                    <div><span className="text-muted-foreground">Balance:</span> ₹{sim.balance}</div>
                  </div>

                  <Separator className="my-2" />

                  {/* Game Controls */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Advance Day is always available */}
                    <Button onClick={advanceDay}>Advance Day</Button>

                    {/* Water is always available (costs small amount) */}
                    <Button variant="outline" onClick={waterField}>
                      Water Field
                    </Button>

                    {/* Plant options when empty */}
                    {!sim.crop && (
                      <>
                        <Button variant="secondary" onClick={() => plantCrop("rice")}>
                          Plant Rice (₹200)
                        </Button>
                        <Button variant="secondary" onClick={() => plantCrop("wheat")}>
                          Plant Wheat (₹200)
                        </Button>
                      </>
                    )}

                    {/* Harvest when ready */}
                    {sim.crop && sim.stage === "maturity" && (
                      <Button className="col-span-2" onClick={doHarvest}>
                        Harvest
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

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