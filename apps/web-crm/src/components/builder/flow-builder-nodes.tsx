"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Box, Chip, Typography } from "@mui/material";
import type { FlowNodeData } from "@uniwai/shared";
import { FLOW_NODE_LABELS } from "@uniwai/shared";

function FlowBuilderNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as FlowNodeData;
  const typeLabel = FLOW_NODE_LABELS[nodeData.nodeType] ?? nodeData.nodeType;

  return (
    <Box
      sx={{
        minWidth: 180,
        maxWidth: 260,
        p: 1.5,
        borderRadius: 2,
        border: 2,
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: "background.paper",
        boxShadow: selected ? 2 : 0,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Chip label={typeLabel} size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
      <Typography variant="subtitle2" fontWeight={600}>
        {nodeData.label}
      </Typography>
      {nodeData.text ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {String(nodeData.text).slice(0, 80)}
          {String(nodeData.text).length > 80 ? "…" : ""}
        </Typography>
      ) : null}
      {nodeData.buttons?.length ? (
        <StackButtons buttons={nodeData.buttons} />
      ) : null}
      <Handle type="source" position={Position.Bottom} />
    </Box>
  );
}

function StackButtons({ buttons }: { buttons: NonNullable<FlowNodeData["buttons"]> }) {
  return (
    <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {buttons.map((b) => (
        <Chip key={b.id} label={b.label} size="small" variant="outlined" />
      ))}
    </Box>
  );
}

export const flowNodeTypes = {
  flowNode: memo(FlowBuilderNodeComponent),
};
