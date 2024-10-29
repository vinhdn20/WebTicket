import React from "react";
import TicketTable from "./form/index";
import AccountCreation from "./account/index";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AccountCreation />} />
        <Route path="/home" element={<TicketTable />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
