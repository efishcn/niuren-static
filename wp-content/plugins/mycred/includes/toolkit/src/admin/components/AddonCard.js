import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  FormControlLabel,
  Skeleton,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { __ } from "@wordpress/i18n";
import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";

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

const cardStyles = {
  width: "100%",
  height: "100%",
  minHeight: "250px",
  position: "relative",
  borderRadius: "8px",
  border: "1px solid transparent",
  display: "flex",
  flexDirection: "column",
};

const AddonCard = ({
  addOn,
  loading,
  contains,
  Addons,
  handleToggleClick,
  renderSVG,
}) => {
  return (
    <Card sx={cardStyles}>
      <CardContent sx={{ flex: 1, pb: 0 }}>
        {loading ? (
          <>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={2}
            >
              <Skeleton
                variant="rectangular"
                width={57}
                height={57}
                sx={{ borderRadius: 8 }}
              />
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
            <Skeleton variant="text" width="70%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="90%" height={20} />
          </>
        ) : (
          <>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={2}
            >
              <Box sx={{ width: "57px", height: "63px" }}>
                {renderSVG(
                  addOn.slug,
                  addOn.type
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
              
                {addOn.type === "pro" && (
                  <Box
                    sx={{
                      borderRadius: "8px",
                      borderWidth: "1px",
                      display: "inline-flex",
                      padding: "4px 5px",
                      justifyContent: "center",
                      alignItems: "center",
                      background:
                        "linear-gradient(248deg, #FFD79C 17.34%, #FFAF39 88.08%)",
                      color: "#694214",
                      fontSize: "11px",
                      fontWeight: 600,
                      lineHeight: "normal",
                      cursor: "default",
                    }}
                  >
                    PRO
                  </Box>
                )}

                {/* Settings icon - always render, but disable if not available */}
                <IconButton
                  size="small"
                  aria-label="settings"
                  sx={{ alignSelf: "flex-start" }}
                  disabled={
                    !contains(Addons, addOn.slug) || addOn.status === "locked"
                  }
                  onClick={() => {
                    if (
                      contains(Addons, addOn.slug) &&
                      addOn.status !== "locked"
                    ) {
                      window.location.href = `${window.location.origin}/${addOn.settingUrl}`;
                    }
                  }}
                >
                  <SettingsIcon
                    fontSize="small"
                    sx={{
                      cursor:
                        contains(Addons, addOn.slug) &&
                        addOn.status !== "locked"
                          ? "pointer"
                          : "not-allowed",
                    }}
                  />
                </IconButton>
              </Box>
            </Box>

            <Typography sx={{ color: "#2D1572" }} variant="h6" mb={1}>
              {addOn.title}
            </Typography>

            <Typography variant="body2" mb={2}>
              {addOn.description.length > 100
                ? `${addOn.description.slice(0, 100)}...`
                : addOn.description}
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
            <Skeleton
              variant="rectangular"
              width={120}
              height={32}
              sx={{ borderRadius: 1 }}
            />
          </>
        ) : (
          <>
            <Typography
              component="a"
              onClick={() =>
                window.open(addOn.addonUrl, "_blank", "noopener,noreferrer")
              }
              variant="body2"
              sx={{
                color: "#9496C1",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              {__("Learn More", "mycred-toolkit")}
            </Typography>

            <FormControlLabel
              control={
                <ToggleSwitch
                  checked={contains(Addons, addOn.slug)}
                  onChange={() => handleToggleClick(addOn)}
                  disabled={loading}
                  sx={{ marginRight: "16px" }}
                />
              }
              label={
                loading
                  ? "Loading..."
                  : contains(Addons, addOn.slug)
                  ? "Enabled"
                  : "Disabled"
              }
              labelPlacement="start"
              sx={{
                marginLeft: "10px",
                gap: "10px",
                color: contains(Addons, addOn.slug)
                  ? "#5F2CED"
                  : "#9496C1",
              }}
            />
          </>
        )}
      </Box>
    </Card>
  );
};

export default AddonCard;
