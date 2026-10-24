import { Redis } from "ioredis";
import { env } from "@/env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis = globalForRedis.redis ?? new Redis(env.REDIS_URL);

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

const CODE_TTL_SECONDS = 600;

export const verificationKey = (type: string, identifier: string) =>
  `verify:${type}:${identifier}`;

export const saveVerificationCode = (
  key: string,
  code: string,
  ttlSeconds = CODE_TTL_SECONDS,
) => redis.set(key, code, "EX", ttlSeconds);

export const getVerificationCode = (key: string) => redis.get(key);

export const deleteVerificationCode = (key: string) => redis.del(key);
