// schema v2 - StepConnection, parentStepId, stepId
// Import from client-new to get fresh Turbopack compilation
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../../node_modules/.prisma/client-new/index.js");

const SCHEMA_VERSION = "v3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

// Reset singleton if schema version changed
if (globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION) {
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
