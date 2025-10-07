import { createTheme } from "@mui/material/styles";
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7CFC00" },
    background: { default: "#000000", paper: "#0a0a0a" },
    text: { primary: "#FFFFFF", secondary: "#CFCFCF" },
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 12, textTransform: "none" } },
    },
    MuiAppBar: { styleOverrides: { root: { background: "#000000" } } },
  },
});
