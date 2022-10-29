import React, { useEffect } from "react";
import {
  Route,
  Switch,
  Redirect,
  withRouter,
} from "react-router-dom";
import classnames from "classnames";

// styles
import useStyles from "./styles";

// components
import Header from "../Header";

// pages
import PersonalApy from "../../pages/contract";

// context
import { useLayoutState } from "../../context/LayoutContext";
import { BackTop } from "antd";

import { ReactNotifications } from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'

function Layout(props) {
  var classes = useStyles();

  // global
  var layoutState = useLayoutState();

  return (
    <div className={classes.root}>
      <>
        <ReactNotifications />
        <Header history={props.history} />
        <div
          className={classnames(classes.content, {
            [classes.contentShift]: layoutState.isSidebarOpened,
          })}
        >
          <div className={classes.fakeToolbar} />
          <Switch>
            <Route path="/" component={PersonalApy} />
          </Switch>
        </div>
        <BackTop />
      </>
    </div>
  );
}

export default withRouter(Layout);
