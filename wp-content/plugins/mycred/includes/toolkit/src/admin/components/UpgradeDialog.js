import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Typography,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ReactComponent as MyCredDialogLogo } from "../icons/mycred-dialog-logo.svg";
import { ReactComponent as BackgroundSVG } from "../icons/popup-background.svg";

const UpgradeDialog = ({ open, handleClose }) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      sx={{
        "& .MuiDialog-paper": {
          width: "602px",
          height: "379px",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#2D1572",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 0,
        },
      }}
    >
      <BackgroundSVG
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

      <DialogTitle
        sx={{
          backgroundColor: "transparent",
          color: "#fff",
          fontSize: "28px",
          fontWeight: "600",
          textAlign: "center",
          position: "relative",
          padding: "16px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1,
          fontFamily: "'Figtree', sans-serif",
        }}
      >
        <MyCredDialogLogo
          style={{
            marginTop: "15px",
          }}
        />
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "#fff",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          textAlign: "center",
          padding: "20px 30px",
          fontSize: "18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          zIndex: 1,
          fontFamily: "'Figtree', sans-serif",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            fontSize: "22px",
            marginBottom: "16px",
            color: "#fff",
            fontFamily: "'Figtree', sans-serif",
          }}
        >
          <span style={{ color: "#FFA500" }}>Join Over 10,000+</span>{" "}
          WordPress Site Owners to Gamify User Engagement
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: "16px",
            color: "#FFFFFF",
            marginBottom: "20px",
            fontFamily: "'Figtree', sans-serif",
          }}
        >
          Get more from your WordPress site by upgrading to myCred Pro!
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "center",
          paddingBottom: "20px",
          width: "100%",
          zIndex: 1,
        }}
      >
        <Button
          onClick={() => {
            window.location.href = "https://mycred.me/pricing/";
          }}
          variant="contained"
          sx={{
            borderRadius: "45px",
            backgroundColor: "#F19C38",
            color: "#341883",
            fontWeight: "bold",
            marginBottom: "30px",
            padding: "10px 20px",
            fontSize: "14px",
            fontFamily: "'Figtree', sans-serif",
            "&:hover": {
              backgroundColor: "#FF9800",
            },
          }}
        >
          Get myCred Pro
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeDialog; 