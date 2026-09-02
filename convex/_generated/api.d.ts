/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analyze from "../analyze.js";
import type * as auth from "../auth.js";
import type * as cache from "../cache.js";
import type * as cacheKey from "../cacheKey.js";
import type * as critic from "../critic.js";
import type * as crons from "../crons.js";
import type * as dedupe from "../dedupe.js";
import type * as engines from "../engines.js";
import type * as http from "../http.js";
import type * as llm from "../llm.js";
import type * as llmCore from "../llmCore.js";
import type * as pipeline from "../pipeline.js";
import type * as playbook from "../playbook.js";
import type * as pulse from "../pulse.js";
import type * as replies from "../replies.js";
import type * as seed from "../seed.js";
import type * as serp from "../serp.js";
import type * as usage from "../usage.js";
import type * as usageRules from "../usageRules.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analyze: typeof analyze;
  auth: typeof auth;
  cache: typeof cache;
  cacheKey: typeof cacheKey;
  critic: typeof critic;
  crons: typeof crons;
  dedupe: typeof dedupe;
  engines: typeof engines;
  http: typeof http;
  llm: typeof llm;
  llmCore: typeof llmCore;
  pipeline: typeof pipeline;
  playbook: typeof playbook;
  pulse: typeof pulse;
  replies: typeof replies;
  seed: typeof seed;
  serp: typeof serp;
  usage: typeof usage;
  usageRules: typeof usageRules;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
