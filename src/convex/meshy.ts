"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

// Utility sleep
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const generateFromFarmPhoto: any = action({
  args: { id: v.id("farms") },
  handler: async (ctx: any, args: any): Promise<any> => {
    const apiKey = process.env.MESHY_API_KEY;
    if (!apiKey) {
      throw new Error("Meshy API key not configured. Please set MESHY_API_KEY in Integrations.");
    }

    // Ensure user owns the farm, and get farm data
    const farm = await ctx.runQuery(internal.farms.ownedFarm, { id: args.id });

    // Short-circuit if already ready
    if (farm.modelStatus === "ready") {
      return {
        success: true,
        modelUrl: farm.modelUrl,
        previewUrl: farm.modelPreviewUrl,
        taskId: farm.meshyTaskId,
        note: "Model already ready",
      };
    }
    // If already processing, avoid submitting another job
    if (farm.modelStatus === "processing" && farm.meshyTaskId) {
      return { success: true, pending: true, taskId: farm.meshyTaskId, note: "Already processing" };
    }

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
    const submitResp = await fetch("https://api.meshy.ai/openapi/v1/image-to-3d", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: photoUrl,
        enable_pbr: true,
      }),
    });

    if (!submitResp.ok) {
      const txt = await submitResp.text().catch(() => "");
      await ctx.runMutation(internal.farms.setModelMeta, {
        id: args.id,
        modelStatus: "failed",
      });
      throw new Error(`Meshy submission failed: ${submitResp.status} ${txt || submitResp.statusText}`);
    }
    const submitJson: any = await submitResp.json();
    const taskId: string =
      (typeof submitJson?.result === "string" && submitJson.result) ||
      submitJson?.task_id ||
      submitJson?.taskId;
    if (!taskId) {
      await ctx.runMutation(internal.farms.setModelMeta, {
        id: args.id,
        modelStatus: "failed",
      });
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
      const statusResp = await fetch(`https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!statusResp.ok) continue;
      const statusJson: any = await statusResp.json();

      const rawStatus =
        statusJson?.status || statusJson?.task_status || statusJson?.data?.status;
      const status =
        typeof rawStatus === "string" ? rawStatus.toLowerCase() : String(rawStatus || "").toLowerCase();

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
    return { success: true, pending: true, taskId, note: "Timed out while polling; still processing" };
  },
});

// Add: Single-shot status checker to recover from "failed to generate"/long waits
export const checkStatus: any = action({
  args: { id: v.id("farms") },
  handler: async (ctx, args) => {
    const apiKey = process.env.MESHY_API_KEY;
    if (!apiKey) {
      throw new Error("Meshy API key not configured. Please set MESHY_API_KEY in Integrations.");
    }

    const farm = await ctx.runQuery(internal.farms.ownedFarm, { id: args.id });
    const taskId = farm.meshyTaskId;

    if (!taskId) {
      return {
        success: true,
        status: farm.modelStatus ?? "unknown",
        note: "No existing task id; generate again if needed",
      };
    }

    const statusResp = await fetch(`https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!statusResp.ok) {
      const txt = await statusResp.text().catch(() => "");
      return {
        success: false,
        error: `Status check failed: ${statusResp.status} ${txt || statusResp.statusText}`,
      };
    }

    const statusJson: any = await statusResp.json();
    const rawStatus =
      statusJson?.status || statusJson?.task_status || statusJson?.data?.status;
    const status =
      typeof rawStatus === "string" ? rawStatus.toLowerCase() : String(rawStatus || "").toLowerCase();

    if (status === "succeeded" || status === "completed" || status === "success") {
      const result = statusJson?.result || statusJson?.output || statusJson?.data || {};
      const urls = result?.model_urls || {};
      const modelUrl = urls?.glb || urls?.gltf || urls?.usdz;
      const previewUrl =
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

      return { success: true, status: "ready", modelUrl, previewUrl, taskId };
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
      return { success: false, status: "failed", error: reason, taskId };
    }

    // Still queued/processing
    await ctx.runMutation(internal.farms.setModelMeta, {
      id: args.id,
      modelStatus: "processing",
      meshyTaskId: taskId,
    });
    return { success: true, status, taskId };
  },
});