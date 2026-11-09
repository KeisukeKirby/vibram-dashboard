import { PrismaClient } from '@prisma/client';
import { withSchema } from '../../scripts/dbUrl.cjs';

const prismaClientSingleton = () => {
  return new PrismaClient({ datasourceUrl: withSchema(process.env.DATABASE_URL) });
};

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
