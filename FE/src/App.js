import React from "react";
import TicketTable2 from "./form/index2";
import AccountCreation from "./account/index";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AccountCreation />} />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <TicketTable2 />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
