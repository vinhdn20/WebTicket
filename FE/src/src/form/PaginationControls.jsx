// src/form/PaginationControls.jsx
import React from 'react';
import PropTypes from 'prop-types';

const PaginationControls = ({
  pageIndex,
  pageCount,
  handlePreviousPage,
  handleNextPage,
  handlePageSizeChange,
  pageSize,
}) => (
  <div style={{ marginTop: "20px", textAlign: "center" }}>
    <button
      onClick={handlePreviousPage}
      disabled={pageIndex === 1}
      style={{
        cursor: pageIndex === 1 ? "not-allowed" : "pointer",
        marginRight: "10px",
      }}
      aria-label="Previous Page"
    >
      Previous
    </button>
    <span>
      Page {pageIndex} of {pageCount || 1}
    </span>
    <button
      onClick={handleNextPage}
      disabled={pageIndex >= pageCount}
      style={{
        cursor: pageIndex >= pageCount ? "not-allowed" : "pointer",
        marginLeft: "10px",
      }}
      aria-label="Next Page"
    >
      Next
    </button>
    <select
      value={pageSize}
      onChange={handlePageSizeChange}
      style={{ marginLeft: "10px" }}
      aria-label="Select Page Size"
    >
      {[10, 20, 50, 100].map((size) => (
        <option key={size} value={size}>
          Show {size}
        </option>
      ))}
    </select>
  </div>
);

PaginationControls.propTypes = {
  pageIndex: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  handlePreviousPage: PropTypes.func.isRequired,
  handleNextPage: PropTypes.func.isRequired,
  handlePageSizeChange: PropTypes.func.isRequired,
  pageSize: PropTypes.number.isRequired,
};

export default React.memo(PaginationControls);
