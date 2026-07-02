import { Hono } from "hono";
import type { AppBindings } from "../../types";
import { authRequired } from "../../middleware/auth";
import { tenantRequired } from "../../middleware/tenant";
import tenants from "./tenants";
import contacts from "./contacts";
import botflows from "./botflows";
import kanban from "./kanban";
import ai from "./ai";
import auth from "./auth";
import users from "./users";
import admin from "./admin";

const v1 = new Hono<AppBindings>();

v1.route("/auth", auth);

v1.use("*", authRequired);

v1.use("/contacts/*", tenantRequired);
v1.use("/botflows/*", tenantRequired);
v1.use("/kanban/*", tenantRequired);
v1.use("/ai/*", tenantRequired);
v1.use("/users/*", tenantRequired);

v1.route("/tenants", tenants);
v1.route("/contacts", contacts);
v1.route("/botflows", botflows);
v1.route("/kanban", kanban);
v1.route("/ai", ai);
v1.route("/users", users);
v1.route("/admin", admin);

export default v1;
