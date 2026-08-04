import { BotBuilderCanvas } from "@/src/components/builder/bot-builder-canvas";
import { Box } from "@mui/material";

export default function BuilderPage() {
  return (
    <Box sx={{ width: "100%", maxWidth: "100%" }}>
      <BotBuilderCanvas />
    </Box>
  );
}
