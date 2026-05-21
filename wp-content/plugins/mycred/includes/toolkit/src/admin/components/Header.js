import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Button,
  InputAdornment,
} from "@mui/material";
import { __ } from "@wordpress/i18n";
import { ReactComponent as MyCredLogo } from "../icons/mycred-logo.svg";
import { ReactComponent as UpgradeVector } from "../icons/upgrade-vector.svg";

const Header = ({ searchTerm, handleSearchData, handleOpen, upgraded }) => {
  return (
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

        {upgraded && (
          <Button
            variant="outlined"
            sx={{
              border: "none",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "none",
              backgroundColor: "#FFD79C",
              color: "#7A5323",
              textTransform: "capitalize",
              padding: "7px 21px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={handleOpen}
          >
            <UpgradeVector />
            {__("Upgrade Now", "mycred-toolkit")}
          </Button>
        )}

        <TextField
          variant="outlined"
          placeholder="Search"
          value={searchTerm}
          onChange={handleSearchData}
          sx={{
            padding: "14px",
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment
                position="start"
                sx={{ color: "#036666" }}
              ></InputAdornment>
            ),
            sx: {
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            },
          }}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header; 