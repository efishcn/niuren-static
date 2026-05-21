import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  Box,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Skeleton,
  Link,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { __ } from "@wordpress/i18n";
import { ReactComponent as MyCredLogo } from "./icons/mycred-logo.svg";
import { styled } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "@fontsource/figtree";
import "@fontsource/figtree/700.css";

import addOnsData from "./addons.json";

const theme = createTheme({
  palette: {
    primary: { main: "#4A90E2" },
    secondary: { main: "#E64A19" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

const ToggleSwitch = styled(Switch)(({ theme }) => ({
  width: 42,
  height: 20,
  padding: 0,
  display: "flex",
  "&:active": {
    "& .MuiSwitch-thumb": {
      width: 15,
    },
    "& .MuiSwitch-switchBase.Mui-checked": {
      transform: "translateX(22px)",
    },
  },
  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(22px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: "#5F2CED",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "0 2px 4px 0 rgb(0 35 11 / 20%)",
    width: 16,
    height: 16,
    borderRadius: 8,
    transition: theme.transitions.create(["width"], {
      duration: 200,
    }),
  },
  "& .MuiSwitch-track": {
    borderRadius: 10,
    opacity: 1,
    backgroundColor: "#E0E0E0",
    boxSizing: "border-box",
  },
}));

const App = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [Addons, setAddons] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const contains = (data, value) => {
    if (Array.isArray(data)) {
      return data.includes(value);
    } else if (data && typeof data === "object") {
      return Object.values(data).includes(value);
    }
    return false;
  };

  const fetchAddOns = async () => {
    try {
      setLoading(true);
      const siteUrl = `${window.mycredAddonsData.root}mycred/v1/get-core-addons`;

      const response = await fetch(siteUrl, {
        method: "GET",
        headers: {
          "X-WP-Nonce": window.mycredAddonsData.nonce,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const addonsResponse = await response.json();
      setAddons(addonsResponse);
    } catch (error) {
      setSnackbarMessage("Error fetching add-ons: " + error.message);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddOns();
  }, []);

  const handleToggleClick = async (addOn) => {
    if (loading) return;

    setLoading(true);
    try {
      const siteUrl = `${window.mycredAddonsData.root}mycred/v1/enable-core-addon`;

      const response = await fetch(siteUrl, {
        method: "POST",
        headers: {
          "X-WP-Nonce": window.mycredAddonsData.nonce,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addOnSlug: addOn.slug,
          addOnTitle: addOn.title,
        }),
      });

      const result = await response.json();
      fetchAddOns();
      setSnackbarMessage(result.message);
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Error toggling addon");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchData = (event) => {
    setSearchTerm(event.target.value);
  };

  const renderSVG = (iconSlug) => {
    try {
      const IconComponent = require(`./icons/${iconSlug}.svg`).default;

      if (IconComponent.startsWith("data:image/svg+xml")) {
        return (
          <div
            dangerouslySetInnerHTML={{
              __html: atob(IconComponent.split(",")[1]),
            }}
          />
        );
      }

      return <IconComponent width={24} height={24} />;
    } catch (error) {
      console.error(`SVG not found for icon name: ${iconSlug}`);
      return null;
    }
  };

  const filteredAddons = addOnsData.filter((addOn) =>
    addOn.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          color="default"
          elevation={0}
          sx={{
            boxShadow: "0px 4px 8.4px 0px rgba(94, 44, 237, 0.06)",
            border: "none",
            position: "static",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Toolbar>
            <Typography
              variant="h4"
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <MyCredLogo />
            </Typography>

            <TextField
              variant="outlined"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchData}
              sx={{
                padding: "14px",
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start" />,
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                },
              }}
            />
          </Toolbar>
        </AppBar>
      </Box>

      <Box
        sx={{
          padding: 4,
          backgroundColor: "#F0F4FF",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: "500",
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {__("Built-in Addons", "mycred")}
        </Typography>
        <br />

        <Grid container spacing={3}>
          {filteredAddons.map((addOn) => (
            <Grid item xs={12} sm={6} md={4} key={addOn.slug}>
              <Card
                sx={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  borderRadius: "8px",
                  border: "1px solid transparent",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {loading ? (
                    <>
                      <Box mb={2}>
                        <Skeleton variant="circular" width={50} height={50} />
                      </Box>
                      <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="text" width="90%" />
                      <Skeleton variant="text" width="70%" />
                    </>
                  ) : (
                    <>
                      <Box mb={2}>
                        {renderSVG(addOn.slug)}
                      </Box>

                      <Typography sx={{ color: "#2D1572" }} variant="h6" mb={1}>
                        {addOn.title}
                      </Typography>

                      <Typography variant="body2" mb={2}>
                        {addOn.description.slice(0, 110) +
                          (addOn.description.length > 110 ? "..." : "")}
                      </Typography>
                    </>
                  )}
                </CardContent>

                <Box
                  sx={{
                    backgroundColor: "#F6F9FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    mt: "auto",
                  }}
                >
                  {loading ? (
                    <>
                      <Skeleton variant="text" width={80} />
                      <Skeleton variant="rectangular" width={80} height={24} />
                    </>
                  ) : (
                    <>
                      <Link
                        component="a"
                        href={addOn.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body2"
                        sx={{
                          color: "#9496C1",
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        Learn More
                      </Link>

                      <FormControlLabel
                        control={
                          <ToggleSwitch
                            checked={contains(Addons, addOn.slug)}
                            onChange={() => handleToggleClick(addOn)}
                            disabled={loading}
                             sx={{
                              marginRight: "16px",
                            }}
                          />
                        }
                        label={contains(Addons, addOn.slug) ? "Enabled" : "Disabled"}
                        labelPlacement="start"
                        sx={{
                          gap: "10px",
                          color: contains(Addons, addOn.slug) ? "#5F2CED" : "#9496C1",
                        }}
                      />
                    </>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Snackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: "green",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            fontSize: "16px",
          },
        }}
        message={
          <Box display="flex" alignItems="center">
            <CheckCircleIcon sx={{ mr: 1, color: "#fff" }} />
            <Typography>{snackbarMessage}</Typography>
          </Box>
        }
      />
    </ThemeProvider>
  );
};

export default App;