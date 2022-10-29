import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Button
} from "@material-ui/core";
import {
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
} from "@material-ui/icons";
import classNames from "classnames";
import useStyles from "./styles";
import { Typography } from "../Wrappers";
import {
  useLayoutState,
  useLayoutDispatch,
  toggleSidebar,
} from "../../context/LayoutContext";

import { connectWallet, getCurrentWalletConnected } from "../../utils";


export default function Header(props) {
  var classes = useStyles();
  var layoutState = useLayoutState();
  var layoutDispatch = useLayoutDispatch();

  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState(false);

  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus(true);
        } else {
          setWallet("");
          setStatus(false);
        }
      });
    } else {
      setStatus(false);
    }
  }

  useEffect(() => {
    (async () => {
      const { address, status } = await getCurrentWalletConnected();
      setWallet(address);
      setStatus(status);
      addWalletListener();
    })()
  }, []);

  return (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        <Typography variant="h6" weight="medium" className={classes.logotype}>
          PersonalApy Admin
        </Typography>
        <div className={classes.grow} />
        <Button
          variant="outlined"
          className="text-white"
          onClick={() => connectWallet(97)}
          sx={{
            fontSize: {
              xs: "11px",
              md: "14px"
            }
          }}
        >
          {walletAddress.length > 0 ? (
            "Connected: " +
            String(walletAddress).substring(0, 6) +
            "..." +
            String(walletAddress).substring(38)
          ) : (
            <span>Connect Wallet</span>
          )}
        </Button>
      </Toolbar>
    </AppBar>
  );
}
