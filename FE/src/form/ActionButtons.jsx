// src/form/ActionButtons.jsx
import React from 'react';
import PropTypes from 'prop-types';

const ActionButtons = ({
  isEditing,
  toggleEditMode,
  selectedRowsCount,
  handleDeleteSelectedRows,
}) => (
  <div style={{ marginTop: "20px", textAlign: "center" }}>
    <button
      onClick={toggleEditMode}
      style={{
        marginRight: "10px",
        cursor: selectedRowsCount === 0 ? "not-allowed" : "pointer",
      }}
      disabled={selectedRowsCount === 0}
      aria-label={isEditing ? "Save Changes" : "Edit Selected Rows"}
    >
      {isEditing ? "Save" : "Edit"}
    </button>
    <button
      onClick={handleDeleteSelectedRows}
      disabled={selectedRowsCount === 0}
      style={{
        marginRight: "10px",
        cursor: selectedRowsCount === 0 ? "not-allowed" : "pointer",
      }}
      aria-label="Delete Selected Rows"
    >
      Delete Selected
    </button>
  </div>
);

ActionButtons.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  toggleEditMode: PropTypes.func.isRequired,
  selectedRowsCount: PropTypes.number.isRequired,
  handleDeleteSelectedRows: PropTypes.func.isRequired,
};

export default React.memo(ActionButtons);
