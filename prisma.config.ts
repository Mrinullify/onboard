import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",

    migrations: {
        path: env("DATABASE_URL"),
    },

    datasource: {
        url: env("DATABASE_URL"),
    },

});