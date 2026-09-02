// NOT a generated file, and not meant to look like one. `npx convex dev`
// needs a logged-in deployment (`CONVEX_DEPLOYMENT`) that doesn't exist in
// this environment -- `npx convex codegen` confirmed that:
//
//   ✖ No CONVEX_DEPLOYMENT set, run `npx convex dev` to configure a project
//
// Once Ankit runs `npx convex dev` for real, it will write precisely-typed
// files under convex/_generated/ (server.ts, api.ts, dataModel.ts). At that
// point, switch every `from "./serverApi"` import below to the matching
// `from "./_generated/..."` import and delete this file.
//
// Until then, this wires the exact same builders `convex/server` documents
// for projects without codegen (`queryGeneric`/`anyApi`, see its module
// doc), bound to our own schema.ts, so everything else in convex/ gets real
// type checking against our tables in the meantime.
import {
  actionGeneric,
  anyApi,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  mutationGeneric,
  queryGeneric,
} from "convex/server";
import type {
  ActionBuilder,
  DataModelFromSchemaDefinition,
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  MutationBuilder,
  QueryBuilder,
} from "convex/server";
import type { GenericId } from "convex/values";
import schema from "./schema";

export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export type TableNames = keyof DataModel & string;
export type Doc<T extends TableNames> = DataModel[T]["document"];
export type Id<T extends TableNames | "_storage"> = GenericId<T>;

export const query: QueryBuilder<DataModel, "public"> = queryGeneric;
export const internalQuery: QueryBuilder<DataModel, "internal"> = internalQueryGeneric;
export const mutation: MutationBuilder<DataModel, "public"> = mutationGeneric;
export const internalMutation: MutationBuilder<DataModel, "internal"> = internalMutationGeneric;
export const action: ActionBuilder<DataModel, "public"> = actionGeneric;
export const internalAction: ActionBuilder<DataModel, "internal"> = internalActionGeneric;

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;

// No module-introspecting codegen here, so api/internal aren't precisely
// typed per function the way real codegen's `api.foo.bar` autocomplete is.
// anyApi's proxy still produces working FunctionReferences at runtime --
// `ctx.runQuery(internal.cache.getCached, {...})` resolves to the right
// server function by path -- just without per-function argument checking
// until real codegen replaces this file.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const api: any = anyApi;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const internal: any = anyApi;
