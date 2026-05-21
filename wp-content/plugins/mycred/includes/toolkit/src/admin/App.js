import React, { useState, useEffect } from "react";
import { Box, Grid, Typography, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { __ } from "@wordpress/i18n";
import "@fontsource/figtree";
import "@fontsource/figtree/700.css";

import Header from "./components/Header";
import UpgradeDialog from "./components/UpgradeDialog";
import AddonCard from "./components/AddonCard";
import FilterSection from "./components/FilterSection";
import Notification from "./components/Notification";
import addOnsData from "./addons.json";

const theme = createTheme({
  palette: {
    primary: { main: "#4A90E2" },
    secondary: { main: "#E64A19" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

const categories = [
  "All",
  "Buy Points",
  "Gamifications",
  "Enhancements",
  "Integrations",
  "Cash Out Points"
];

function contains(data, value) {
  if (Array.isArray(data)) {
    return data.includes(value);
  } else if (data && typeof data === "object") {
    return Object.values(data).includes(value);
  }
  return false;
}

const App = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [loading, setLoading] = useState(true);
  const [Addons, setAddons] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const [open, setOpen] = useState(false);
  const [addonsData, setAddonsData] = useState(addOnsData);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const fetchAddOns = async () => {
    try {
      setLoading(true);
      const siteUrl = `${window.mycredAddonsData.root}mycred-toolkit/v1/get-addons`;

      const response = await fetch(siteUrl, {
        method: "GET",
        headers: {
          'X-WP-Nonce': window.mycredAddonsData.nonce,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const Addons = await response.json();
      setAddons(Addons);
    } catch (error) {
      setSnackbarMessage("Error fetching add-ons: " + error.message);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const checkProaddonsfile = async () => {
    try {
      setLoading(true);
      const siteUrl = `${window.mycredAddonsData.root}mycred-toolkit/v1/check-addons-files`;

      const proAddOns = addonsData.filter((addon) => addon.type === "pro");

      const response = await fetch(siteUrl, {
        method: "POST",
        headers: {
          'X-WP-Nonce': window.mycredAddonsData.nonce,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proAddOns: proAddOns,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const Addons = await response.json();

      addonsData.forEach((addon) => {
        const matchingAddon = Addons.find((item) => item.slug === addon.slug);
        if (matchingAddon) {
          addon.status = matchingAddon.status;
        }
      });
    } catch (error) {
      // console.error("Error fetching add-ons: ", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddOns();
    checkProaddonsfile();

    if (window.mycredAddonsData && Array.isArray(window.mycredAddonsData.addons)) {
      setAddonsData(window.mycredAddonsData.addons);
    }
  }, []);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterChange = (type) => {
    setSelectedType(type);
    handleCloseFilter();
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const handleToggleClick = async (addOn) => {
    if (addOn.status === 'locked') {
      handleOpen();
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const siteUrl = `${window.mycredAddonsData.root}mycred-toolkit/v1/enable-addon`;

      const response = await fetch(siteUrl, {
        method: "POST",
        headers: {
          'X-WP-Nonce': window.mycredAddonsData.nonce,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addOnSlug: addOn.slug,
          addOnTitle: addOn.title,
          dependency: addOn.dependency,
          dependencyName: addOn.dependencyName,
        }),
      });

      const result = await response.json();

      // Set notification type based on API response status
      setSnackbarType(result.status);
      setSnackbarMessage(result.message);
      setSnackbarOpen(true);

      // Only fetch addons if the operation was successful
      if (result.status === 'success') {
        fetchAddOns();
      }

    } catch (error) {
      setSnackbarMessage("An error occurred while toggling the addon");
      setSnackbarType("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchData = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (newCategory) => {
    setSelectedCategory(newCategory);
  };

  const renderSVG = (iconSlug, addonType) => {
    try {
      const IconComponent = require(`./icons/${iconSlug}.svg`).default;
      return (
        <Box position="relative" display="inline-block">
          {IconComponent.startsWith("data:image/svg+xml") ? (
            <div
              dangerouslySetInnerHTML={{
                __html: atob(IconComponent.split(",")[1]),
              }}
            />
          ) : (
            <IconComponent width={24} height={24} />
          )}
        </Box>
      );
    } catch (error) {
      console.error(`SVG not found for icon name: ${iconSlug}`);
      return null;
    }
  };

  const filteredAddons = addonsData
    .filter((addOn) =>
      addOn.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (addOn) =>
        selectedCategory === "All" || addOn.category === selectedCategory
    )
    .filter(
      (addOn) =>
        selectedType === "all" || addOn.type === selectedType
    );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Header
        searchTerm={searchTerm}
        handleSearchData={handleSearchData}
        handleOpen={handleOpen}
        upgraded={window.mycredAddonsData.upgraded}
      />

      <UpgradeDialog open={open} handleClose={handleClose} />

      <Box
        sx={{
          padding: 4,
          backgroundColor: "#F0F4FF",
        }}
      >
        <Typography
          variant="p"
          sx={{
            fontWeight: "400",
            color: "#9698C2",
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          
        </Typography>

        <FilterSection
          categories={categories}
          selectedCategory={selectedCategory}
          handleCategoryChange={handleCategoryChange}
          anchorEl={anchorEl}
          handleFilterClick={handleFilterClick}
          handleCloseFilter={handleCloseFilter}
          handleFilterChange={handleFilterChange}
          selectedType={selectedType}
          openFilter={Boolean(anchorEl)}
        />

        <Grid container spacing={3}>
          {filteredAddons.map((addOn) => (
            <Grid item xs={12} sm={6} md={4} key={addOn.slug}>
              <AddonCard
                addOn={addOn}
                loading={loading}
                contains={contains}
                Addons={Addons}
                handleToggleClick={handleToggleClick}
                renderSVG={renderSVG}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Notification
        open={snackbarOpen}
        message={snackbarMessage}
        onClose={() => setSnackbarOpen(false)}
        type={snackbarType}
      />
    </ThemeProvider>
  );
};

export default App;