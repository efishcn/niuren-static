import React from "react";
import { Box, Button, Typography, IconButton, Popover } from "@mui/material";
import FilterAltIcon from '@mui/icons-material/FilterAlt';

const FilterSection = ({
  categories,
  selectedCategory,
  handleCategoryChange,
  anchorEl,
  handleFilterClick,
  handleCloseFilter,
  handleFilterChange,
  selectedType,
  openFilter,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
        flexWrap: "wrap",
      }}
    >
      {/* Left: Categories */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
        }}
      >
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => handleCategoryChange(category)}
            sx={{
              border: "none",
              fontSize: "14px",
              fontWeight: "500",
              backgroundColor:
                selectedCategory === category ? "#EBE4FF" : "#FFFFFF",
              color: selectedCategory === category ? "#7C54F1" : "#9698C2",
              whiteSpace: "nowrap",
            }}
            variant="outlined"
          >
            {category}
          </Button>
        ))}
      </Box>

      {/* Right: Sort by + Filter Icon */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" fontWeight={500} color="text.secondary">
          Sort by
        </Typography>
        <IconButton onClick={handleFilterClick}>
          <FilterAltIcon />
        </IconButton>
        <Popover
          open={openFilter}
          anchorEl={anchorEl}
          onClose={handleCloseFilter}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <Box
            sx={{
              padding: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              minWidth: 180,
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              Filter by Type
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                component="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleFilterChange("all");
                }}
                sx={{
                  color: selectedType === "all" ? "primary.main" : "text.primary",
                  textDecoration: "none",
                  fontWeight: selectedType === "all" ? "bold" : "normal",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                All
              </Typography>
              <Typography
                component="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleFilterChange("free");
                }}
                sx={{
                  color: selectedType === "free" ? "primary.main" : "text.primary",
                  textDecoration: "none",
                  fontWeight: selectedType === "free" ? "bold" : "normal",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Free Add-ons
              </Typography>
              <Typography
                component="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleFilterChange("pro");
                }}
                sx={{
                  color: selectedType === "pro" ? "primary.main" : "text.primary",
                  textDecoration: "none",
                  fontWeight: selectedType === "pro" ? "bold" : "normal",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Pro Add-ons
              </Typography>
            </Box>
          </Box>
        </Popover>
      </Box>
    </Box>
  );
};

export default FilterSection; 