"use client";

import { Box, Typography } from "@mui/material";

export function CrmPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
