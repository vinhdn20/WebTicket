import React from "react";
import TicketTable2 from "./form/index2";
import AccountCreation from "./account/index";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App2 from "./tableTest";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AccountCreation />} />
        <Route path="/home" element={<TicketTable2 />} />
        <Route path="/home2" element={<App2 />} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
