"use strict";
import React from "react";
import express from "express";
import path from "path";

// Redux
import { applyMiddleware, createStore, combineReducers } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";

// React-router
import {RoutingContext, match} from "react-router";
import createLocation from "history/lib/createLocation";
import routes from "./routes/routes";

// Redux-api
import "isomorphic-fetch";
import {init as initRest, reducers} from "./utils/rest";
import adapterFetch from "../../../src/adapters/fetch";

initRest(adapterFetch(fetch), true)

// Init express app
const app = express();

// Include static assets. Not advised for production
app.use(express.static(path.join(__dirname, "..", "dist")));

// Set view path
app.set("views", path.join(__dirname, "..", "views"));

// set up ejs for templating. You can use whatever
app.set("view engine", path.join(__dirname, "..", "ejs"));

app.use(function(req, res, next) {
  const location = createLocation(req.url);
  const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
  const reducer = combineReducers(reducers);
  const store = createStoreWithMiddleware(reducer);
  const childRoutes = routes(store);
  match({ routes: childRoutes, location }, (error, redirectLocation, renderProps)=> {
    if (redirectLocation) {
      res.status(301).redirect(redirectLocation.pathname + redirectLocation.search);
    } else if (error) {
      res.status(500).send(error.message);
    } else if (renderProps === null) {
      res.status(404).render("404.ejs");
    } else {
      const html = React.renderToString(
        <Provider store={store}>
          {() => <RoutingContext {...renderProps} />}
        </Provider>
      );
      res.render("index.ejs", { html, json: JSON.stringify(store.getState()) });
    }
  });
});

const server = app.listen(4444, function() {
  const {port} = server.address();
  console.log("Server started at http://localhost:%s", port);
});