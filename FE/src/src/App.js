import React from "react";
import TicketTable2 from "./form/index2";
import AccountCreation from "./account/index";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AccountCreation />} />
        <Route path="/home" element={<TicketTable2 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
