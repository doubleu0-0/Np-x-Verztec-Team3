import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, RefreshCw, Filter, Loader, Search } from "lucide-react";
import { createDataStream } from "ai";
import { format, parseISO, isValid } from "date-fns";

// Just change the display names to be more user-friendly
// This is a simple mapping of column names to display names
const COLUMN_DISPLAY_NAMES = {
  uploaded_by_username: "Uploaded by",
  created_at: "Created On",
  deleted_by_username: "Deleted By",
  deleted_at: "Deleted On",
  changed_by_username: "Changed By",
  changed_at: "Changed On",
  target_username: "Updated User",
  deleted_username: "Deleted User",
  target_email: "Updated Email",
  reset_at: "Reset On",
  deleted_file_name: "Deleted File",
};

const DATE_COLUMNS = [
  "created_at",
  "deleted_at",
  "changed_at",
  "reset_at",
  "upload_time",
  "login_time",
  "timestamp",
  "expires_at",
  "expired_at",
  "updated_at",
];

export default function DatabaseLogs({ isDarkMode, activeLogTab }) {
  const [logs, setLogs] = useState({ columns: [], rows: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [logsPerPage, setLogsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [expandedRow, setExpandedRow] = useState(null);
  const scrollRef = useRef(null);
  const dragRef = useRef(false); // NEW: track if a drag happened

  // Get the display name for the current log tab
  const getLogTabDisplayName = (tabKey) => {
    const LOG_TAB_NAMES = {
      "chatbot_logs": "Chatbot Logs",
      "login_logs": "Login Logs",
      "upload_user_logs": "Upload User Logs",
      "upload_file_logs": "Upload File Logs",
      "file_deletion_logs": "File Deletion Logs",
      "user_update_logs": "User Update Logs",
      "user_deletion_logs": "User Deletion Logs",
      "file_update_logs": "File Update Logs",
      "password_reset_audit": "Password Reset Audit",
      "password_reset_tokens": "Password Reset Tokens",
    };
    return LOG_TAB_NAMES[tabKey] || "Database Logs";
  };

  // Fetch logs from backend
  const fetchLogs = async (tab) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/logs/${tab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();

        // Filter out primary ID columns
        let filteredColumns = data.columns.filter(col =>
          !col.toLowerCase().includes('_id') ||
          col.toLowerCase().includes('user_id') ||
          col.toLowerCase().includes('file_id') ||
          col.toLowerCase().includes('conversation_id')
        );

        // Hide file_id only for file_update_logs
        if (tab === "file_update_logs") {
          filteredColumns = filteredColumns.filter(col => col !== "file_id");
        }

        // Filter rows to only include non-ID columns
        const filteredRows = data.rows.map(row => {
          const filteredRow = {};
          filteredColumns.forEach(col => {
            filteredRow[col] = row[col];
          });
          return filteredRow;
        });

        setLogs({ columns: filteredColumns, rows: filteredRows });
      } else {
        setLogs({ columns: [], rows: [] });
      }
    } catch {
      setLogs({ columns: [], rows: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeLogTab) fetchLogs(activeLogTab);
    setSearchTerm("");
    setSelectedColumns({});
    setCurrentPage(1);
    setSortConfig({ key: null, direction: "asc" });
    // eslint-disable-next-line
  }, [activeLogTab]);

  // Filtering and searching
  const filteredRows = logs.rows
    .filter((row) => {
      // Search
      if (!searchTerm) return true;
      return logs.columns.some((col) =>
        String(row[col] ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    })
    .filter((row) => {
      // Column filters
      return Object.entries(selectedColumns).every(([col, value]) => {
        if (!value) return true;
        return String(row[col] ?? "") === value;
      });
    });

  // Sorting
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";
    return sortConfig.direction === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / logsPerPage);
  const paginatedRows = sortedRows.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [logsPerPage, searchTerm, selectedColumns]);

  // Sorting UI
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === "asc"
      ? <ChevronUp className="w-4 h-4 text-yellow-600" />
      : <ChevronDown className="w-4 h-4 text-yellow-600" />;
  };

  // Unique values for filter popup
  const getUniqueValues = (col) => {
    const values = logs.rows.map((row) => String(row[col] ?? ""));
    return Array.from(new Set(values)).filter((v) => v !== "");
  };

  // Helper to get display name for a column, with special case for chatbot_logs
  const getColumnDisplayName = (col) => {
    if (col === "created_at" && activeLogTab === "chatbot_logs") return "Timestamp";
    return COLUMN_DISPLAY_NAMES[col] || col.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Helper to format date strings
  const formatDateTime = (value) => {
    if (!value) return "";
    // Try to parse as ISO or fallback to Date
    const date = typeof value === "string" ? parseISO(value) : new Date(value);
    if (!isValid(date)) return value;
    return format(date, "MM/dd/yyyy hh:mm a");
  };

  // Drag-to-scroll logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let isDown = false;
    let startX;
    let scrollLeft;
    let moved = false;

    const mouseDownHandler = (e) => {
      isDown = true;
      moved = false;
      el.classList.add("cursor-grabbing");
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const mouseLeaveHandler = () => {
      isDown = false;
      el.classList.remove("cursor-grabbing");
    };
    const mouseUpHandler = () => {
      isDown = false;
      el.classList.remove("cursor-grabbing");
      dragRef.current = moved; // set dragRef if moved
      setTimeout(() => { dragRef.current = false; }, 0); // reset after click event
    };
    const mouseMoveHandler = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(x - startX) > 5) moved = true;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", mouseDownHandler);
    el.addEventListener("mouseleave", mouseLeaveHandler);
    el.addEventListener("mouseup", mouseUpHandler);
    el.addEventListener("mousemove", mouseMoveHandler);

    return () => {
      el.removeEventListener("mousedown", mouseDownHandler);
      el.removeEventListener("mouseleave", mouseLeaveHandler);
      el.removeEventListener("mouseup", mouseUpHandler);
      el.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, []);

  return (
    <div className="pt-1 pb-2">
      {/* Page title - matching PolicyDocuments header */}
      <div className="mb-2">
        {/* Top controls: search, refresh, per page, filter */}
        <div className="flex gap-4 mb-2 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
            />
            {/* Search icon */}
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
          </div>
          {/* Refresh Button */}
          <button
            onClick={() => fetchLogs(activeLogTab)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-yellow-100 dark:hover:bg-yellow-800 transition"
            title="Refresh logs"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <select
            value={logsPerPage}
            onChange={(e) => setLogsPerPage(Number(e.target.value))}
            className="pl-3 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-base font-medium h-[44px]"
            style={{ minWidth: 120 }}
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
          <button
            type="button"
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center h-[44px]"
            onClick={() => setShowFilterPopup(true)}
            title="Filter"
            style={{ minWidth: 44 }}
          >
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
        </div>
      </div>
      {/* Results summary */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {paginatedRows.length} of {filteredRows.length} logs
      </div>
      {/* Table and Pagination with consistent border */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div
          ref={scrollRef}
          className="overflow-x-auto rounded-lg cursor-grab"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {logs.columns.map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1">
                      {getColumnDisplayName(col)}
                      {getSortIcon(col)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={logs.columns.length} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="animate-spin w-6 h-6 text-yellow-500" />
                      Loading logs...
                    </span>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={logs.columns.length} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No logs found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const isExpanded = expandedRow === idx;
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer${isExpanded ? "" : ""}`}
                      onClick={() => {
                        if (dragRef.current) return; // Prevent expand/collapse if just dragged
                        setExpandedRow(isExpanded ? null : idx);
                      }}
                    >
                      {logs.columns.map((col) => (
                        <td
                          key={col}
                          className={
                            isExpanded
                              ? "px-6 py-4 whitespace-pre-line text-sm text-gray-900 dark:text-white align-top"
                              : "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white max-w-xs truncate"
                          }
                          title={!isExpanded ? row[col] ?? "" : undefined}
                        >
                          {DATE_COLUMNS.includes(col)
                            ? formatDateTime(row[col])
                            : String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination controls - inside the border box */}
        <div className="flex justify-end items-center gap-1 px-2 py-0 pb-2 text-xs">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-xs"
          >
            Prev
          </button>
          <span className="text-xs text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-xs"
          >
            Next
          </button>
        </div>
      </div>
      {/* Filter Popup */}
      {showFilterPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowFilterPopup(false)}
            >
              ×
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter Logs</h2>
            {logs.columns.map((col) => {
              // Only show created_at filter for chatbot_logs
              if (col === "created_at" && activeLogTab !== "chatbot_logs") return null;
              return (
                <div className="mb-4" key={col}>
                  <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                    {getColumnDisplayName(col)}
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    value={selectedColumns[col] || ""}
                    onChange={(e) =>
                      setSelectedColumns((prev) => ({
                        ...prev,
                        [col]: e.target.value,
                      }))
                    }
                  >
                    <option value="">All</option>
                    {getUniqueValues(col).map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                onClick={() => setSelectedColumns({})}
              >
                Clear
              </button>
              <button
                className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                onClick={() => setShowFilterPopup(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}