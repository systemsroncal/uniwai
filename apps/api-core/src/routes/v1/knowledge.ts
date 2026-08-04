import { Hono } from "hono";

import { z } from "zod";

import { prisma } from "@uniwai/database";

import { Permission } from "@uniwai/shared";

import type { AppBindings } from "../../types";

import { getTenantIdOrThrow } from "../../middleware/tenant";

import { requirePermission } from "../../middleware/rbac";

import { embedText, vectorToPgLiteral } from "../../lib/embeddings";



const knowledge = new Hono<AppBindings>();



knowledge.use("*", requirePermission(Permission.MANAGE_AI_BYOK));



const createSchema = z.object({

  title: z.string().min(1).max(200),

  content: z.string().min(10).max(50000),

});



async function storeChunkEmbedding(chunkId: string, content: string): Promise<void> {

  const embedding = await embedText(content);

  const literal = vectorToPgLiteral(embedding);

  await prisma.$executeRawUnsafe(

    `UPDATE knowledge_chunks SET embedding = $1::vector WHERE id = $2`,

    literal,

    chunkId,

  );

}



knowledge.get("/", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const docs = await prisma.knowledgeDocument.findMany({

    where: { tenantId },

    orderBy: { updatedAt: "desc" },

    select: {

      id: true,

      title: true,

      status: true,

      metadata: true,

      createdAt: true,

      updatedAt: true,

      _count: { select: { chunks: true } },

    },

  });

  return c.json({ data: docs });

});



knowledge.get("/search", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const q = c.req.query("q")?.trim();

  if (!q || q.length < 2) {

    return c.json({ error: "Query q requerida (mín. 2 caracteres)" }, 400);

  }



  const queryVec = await embedText(q);

  const literal = vectorToPgLiteral(queryVec);



  const rows = await prisma.$queryRawUnsafe<

    Array<{ id: string; content: string; title: string; distance: number }>

  >(

    `SELECT kc.id, kc.content, kd.title,

            (kc.embedding <=> $1::vector) AS distance

     FROM knowledge_chunks kc

     JOIN knowledge_documents kd ON kd.id = kc."documentId"

     WHERE kc."tenantId" = $2 AND kc.embedding IS NOT NULL

     ORDER BY distance ASC

     LIMIT 5`,

    literal,

    tenantId,

  );



  return c.json({ data: rows });

});



knowledge.post("/", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const payload = createSchema.parse(await c.req.json());



  const doc = await prisma.knowledgeDocument.create({

    data: {

      tenantId,

      title: payload.title,

      status: "PROCESSING",

      metadata: { sourceType: "MANUAL" },

    },

  });



  const chunk = await prisma.knowledgeChunk.create({

    data: {

      tenantId,

      documentId: doc.id,

      content: payload.content,

      chunkIndex: 0,

    },

  });



  try {

    await storeChunkEmbedding(chunk.id, payload.content);

    await prisma.knowledgeDocument.update({

      where: { id: doc.id },

      data: { status: "READY" },

    });

  } catch (err) {

    console.error("[knowledge] embedding failed:", err);

    await prisma.knowledgeDocument.update({

      where: { id: doc.id },

      data: { status: "READY", metadata: { sourceType: "MANUAL", embeddingSkipped: true } },

    });

  }



  return c.json({ data: doc }, 201);

});



knowledge.post("/:documentId/reindex", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const documentId = c.req.param("documentId");



  const doc = await prisma.knowledgeDocument.findFirst({

    where: { id: documentId, tenantId },

    include: { chunks: true },

  });

  if (!doc) return c.json({ error: "Document not found" }, 404);



  for (const chunk of doc.chunks) {

    await storeChunkEmbedding(chunk.id, chunk.content);

  }



  await prisma.knowledgeDocument.update({

    where: { id: doc.id },

    data: { status: "READY" },

  });



  return c.json({ data: { reindexed: doc.chunks.length } });

});



export default knowledge;

