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
import type * as devotional from "../devotional.js";
import type * as http from "../http.js";
import type * as invite from "../invite.js";
import type * as progress from "../progress.js";
import type * as resource from "../resource.js";
import type * as stories from "../stories.js";
import type * as user from "../user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  devotional: typeof devotional;
  http: typeof http;
  invite: typeof invite;
  progress: typeof progress;
  resource: typeof resource;
  stories: typeof stories;
  user: typeof user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
