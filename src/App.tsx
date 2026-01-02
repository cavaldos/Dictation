import React, { Fragment } from 'react';

import MainRoute from './routes';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '~/global.css';
const App: React.FC = () => {

  return (
    <BrowserRouter >

      {/* <Suspense fallback={<Loading />}> */}
      <Routes>
        {MainRoute.map((route, index) => {
          const Layout = route.Layout === null ? Fragment : route.Layout;
          const Page = route.component;
          return (
            <Route
              key={index}
              path={route.path}
              element={
                <Layout>
                  <Page />
                </Layout>
              }
            />
          );
        })}
        <Route
          path="*"
          element={
            <Fragment>
              <h1> 404 Not Found</h1>
            </Fragment>
          }
        />
      </Routes>
      {/* </Suspense> */}
    </BrowserRouter>
  );
}

export default App;
