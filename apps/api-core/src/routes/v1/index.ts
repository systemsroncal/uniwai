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
import whatsapp from "./whatsapp";
import warmup from "./warmup";
import products from "./products";
import campaigns from "./campaigns";
import reports from "./reports";
import settings from "./settings";
import flowTemplates from "./flow-templates";
import orders from "./orders";
import knowledge from "./knowledge";
import webhooks from "./webhooks";

const v1 = new Hono<AppBindings>();

v1.route("/auth", auth);
v1.route("/webhooks", webhooks);

v1.use("*", authRequired);

v1.use("/contacts/*", tenantRequired);
v1.use("/botflows/*", tenantRequired);
v1.use("/kanban/*", tenantRequired);
v1.use("/ai/*", tenantRequired);
v1.use("/users/*", tenantRequired);
v1.use("/whatsapp/*", tenantRequired);
v1.use("/warmup/*", tenantRequired);
v1.use("/products/*", tenantRequired);
v1.use("/campaigns/*", tenantRequired);
v1.use("/reports/*", tenantRequired);
v1.use("/flow-templates/*", tenantRequired);
v1.use("/orders/*", tenantRequired);
v1.use("/settings/*", tenantRequired);
v1.use("/knowledge/*", tenantRequired);

v1.route("/tenants", tenants);
v1.route("/contacts", contacts);
v1.route("/botflows", botflows);
v1.route("/kanban", kanban);
v1.route("/ai", ai);
v1.route("/users", users);
v1.route("/admin", admin);
v1.route("/whatsapp", whatsapp);
v1.route("/warmup", warmup);
v1.route("/products", products);
v1.route("/campaigns", campaigns);
v1.route("/reports", reports);
v1.route("/settings", settings);
v1.route("/flow-templates", flowTemplates);
v1.route("/orders", orders);
v1.route("/knowledge", knowledge);

export default v1;
