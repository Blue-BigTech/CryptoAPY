import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";

// components
import Layout from "./Layout";

// context
import { useUserState } from "../context/UserContext";

export default function App() {
  // global
  var { isLoggedIn } = useUserState();

  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" component={Layout} />
      </Switch>
    </BrowserRouter>
  );
}
