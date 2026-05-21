import React from "react";
import { Snackbar, Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const Notification = ({ open, message, onClose, type = "success" }) => {
  const getNotificationColor = () => {
    switch (type) {
      case "error":
        return "#FF4B4B"; // Bright red-orange color for errors
      case "success":
      default:
        return "#2e7d32"; // Material UI success color
    }
  };

  const getNotificationStyles = () => ({
    "& .MuiSnackbarContent-root": {
      backgroundColor: getNotificationColor(),
      color: "#fff",
      display: "flex",
      alignItems: "center",
      fontSize: "16px",
      boxShadow: type === "error" 
        ? "0px 4px 10px rgba(255, 75, 75, 0.25)"
        : "0px 4px 10px rgba(46, 125, 50, 0.25)",
    }
  });

  return (
    <Snackbar
      open={open}
      onClose={onClose}
      autoHideDuration={6000}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      sx={getNotificationStyles()}
      message={
        <Box display="flex" alignItems="center">
          {type === "error" ? (
            <ErrorIcon sx={{ mr: 1, color: "#fff" }} />
          ) : (
            <CheckCircleIcon sx={{ mr: 1, color: "#fff" }} />
          )}
          <Typography sx={{ fontWeight: type === "error" ? 500 : 400 }}>
            {message}
          </Typography>
        </Box>
      }
    />
  );
};

export default Notification; 