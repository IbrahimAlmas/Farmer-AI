/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as community from "../community.js";
import type * as farms from "../farms.js";
import type * as http from "../http.js";
import type * as market from "../market.js";
import type * as profiles from "../profiles.js";
import type * as resources from "../resources.js";
import type * as seed from "../seed.js";
import type * as sims from "../sims.js";
import type * as soil from "../soil.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";
import type * as voice from "../voice.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  community: typeof community;
  farms: typeof farms;
  http: typeof http;
  market: typeof market;
  profiles: typeof profiles;
  resources: typeof resources;
  seed: typeof seed;
  sims: typeof sims;
  soil: typeof soil;
  tasks: typeof tasks;
  users: typeof users;
  voice: typeof voice;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
