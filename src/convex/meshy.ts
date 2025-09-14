"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

// Utility sleep
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const generateFromFarmPhoto = action({
  args: { id: v.id("farms") },
  handler: async (ctx, args) => {
    const apiKey = process.env.MESHY_API_KEY;
    if (!apiKey) {
      throw new Error("Meshy API key not configured. Please set MESHY_API_KEY in Integrations.");
    }

    // Ensure user owns the farm, and get farm data
    const farm = await ctx.runQuery(internal.farms.ownedFarm, { id: args.id });
    const firstPhoto = farm.cornerPhotos?.[0];
    if (!firstPhoto) {
      throw new Error("Please upload a field photo first.");
    }

    const photoUrl = await ctx.runQuery(api.soil_upload.getFileUrl, { fileId: firstPhoto });
    if (!photoUrl) {
      throw new Error("Could not load photo URL from storage.");
    }

    // Mark as queued
    await ctx.runMutation(internal.farms.setModelMeta, {
      id: args.id,
      modelStatus: "queued",
      modelUrl: undefined,
      modelPreviewUrl: undefined,
      meshyTaskId: undefined,
    });

    // Submit job to Meshy
    const submitResp = await fetch("https://api.meshy.ai/v2/image-to-3d", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: photoUrl,
        enable_pbr: true,
        // Optional tuning:
        // mode: "standard", // or "refine"
        // top_k: 1,
        // texture_size: 2048,
        // colorize: false,
      }),
    });

    if (!submitResp.ok) {
      const txt = await submitResp.text().catch(() => "");
      throw new Error(`Meshy submission failed: ${submitResp.status} ${txt}`);
    }
    const submitJson: any = await submitResp.json();
    const taskId: string = submitJson?.task_id || submitJson?.taskId;
    if (!taskId) {
      throw new Error("Meshy did not return a task_id.");
    }

    await ctx.runMutation(internal.farms.setModelMeta, {
      id: args.id,
      modelStatus: "processing",
      meshyTaskId: taskId,
    });

    // Poll for completion (up to ~2 minutes)
    let modelUrl: string | undefined;
    let previewUrl: string | undefined;
    for (let i = 0; i < 40; i++) {
      await delay(3000);
      const statusResp = await fetch(`https://api.meshy.ai/v2/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!statusResp.ok) continue;
      const statusJson: any = await statusResp.json();

      const status: string =
        statusJson?.status || statusJson?.task_status || statusJson?.data?.status;

      if (status === "succeeded" || status === "completed" || status === "success") {
        const result = statusJson?.result || statusJson?.output || statusJson?.data || {};
        const urls = result?.model_urls || {};
        modelUrl = urls?.glb || urls?.gltf || urls?.usdz;
        previewUrl =
          result?.preview_image ||
          result?.preview_url ||
          result?.preview ||
          result?.image;

        await ctx.runMutation(internal.farms.setModelMeta, {
          id: args.id,
          modelStatus: "ready",
          modelUrl,
          modelPreviewUrl: previewUrl,
          meshyTaskId: taskId,
        });

        return { success: true, modelUrl, previewUrl, taskId };
      }

      if (status === "failed" || status === "error") {
        const reason =
          statusJson?.error ||
          statusJson?.message ||
          statusJson?.data?.error ||
          "Generation failed";
        await ctx.runMutation(internal.farms.setModelMeta, {
          id: args.id,
          modelStatus: "failed",
          meshyTaskId: taskId,
        });
        throw new Error(`Meshy generation failed: ${reason}`);
      }
    }

    // Timed out
    await ctx.runMutation(internal.farms.setModelMeta, {
      id: args.id,
      modelStatus: "processing",
      meshyTaskId: taskId,
    });
    return { success: true, pending: true, taskId };
  },
});
