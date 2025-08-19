import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import {
  FirstPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  LastPage,
  NavigateNext,
  NavigateBefore,
} from '@mui/icons-material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
  showPageNumbers = true,
  maxPageNumbers = 5,
}: PaginationProps) {
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const handleFirstPage = () => {
    if (currentPage > 1) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (currentPage < totalPages) {
      onPageChange(totalPages);
    }
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    if (totalPages <= maxPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfMax = Math.floor(maxPageNumbers / 2);
    let start = Math.max(1, currentPage - halfMax);
    let end = Math.min(totalPages, start + maxPageNumbers - 1);

    if (end - start + 1 < maxPageNumbers) {
      start = Math.max(1, end - maxPageNumbers + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (totalCount === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mt: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No results found
        </Typography>
      </Paper>
    );
  }

  const pageNumbers = getPageNumbers();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mt: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Left side - Results info and page size */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>
              {startItem.toLocaleString()}
            </span>
            {' to '}
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>
              {endItem.toLocaleString()}
            </span>
            {' of '}
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>
              {totalCount.toLocaleString()}
            </span>
            {' results'}
          </Typography>
          
          <Divider orientation="vertical" flexItem />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.875rem' }}>Page Size</InputLabel>
            <Select
              value={pageSize}
              label="Page Size"
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              sx={{
                '& .MuiSelect-select': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
              }}
            >
              {pageSizeOptions.map((option) => (
                <MenuItem key={option} value={option} sx={{ fontSize: '0.875rem' }}>
                  {option} per page
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Right side - Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* First Page */}
          <Tooltip title="First page">
            <IconButton
              onClick={handleFirstPage}
              disabled={currentPage === 1}
              size="small"
              sx={{
                color: currentPage === 1 ? 'text.disabled' : 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                },
              }}
            >
              <FirstPage />
            </IconButton>
          </Tooltip>
          
          {/* Previous Page */}
          <Tooltip title="Previous page">
            <IconButton
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              size="small"
              sx={{
                color: currentPage === 1 ? 'text.disabled' : 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                },
              }}
            >
              <NavigateBefore />
            </IconButton>
          </Tooltip>

          {/* Page Numbers */}
          {showPageNumbers && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mx: 1 }}>
              {pageNumbers.map((page) => (
                <Tooltip key={page} title={`Page ${page}`}>
                  <Button
                    variant={page === currentPage ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handlePageClick(page)}
                    sx={{
                      minWidth: 36,
                      height: 36,
                      fontSize: '0.875rem',
                      fontWeight: page === currentPage ? 600 : 500,
                      borderRadius: 1,
                      ...(page === currentPage && {
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                        },
                      }),
                      ...(page !== currentPage && {
                        borderColor: 'divider',
                        color: 'text.primary',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                        },
                      }),
                    }}
                  >
                    {page}
                  </Button>
                </Tooltip>
              ))}
            </Box>
          )}

          {/* Next Page */}
          <Tooltip title="Next page">
            <IconButton
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              size="small"
              sx={{
                color: currentPage === totalPages ? 'text.disabled' : 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                },
              }}
            >
              <NavigateNext />
            </IconButton>
          </Tooltip>
          
          {/* Last Page */}
          <Tooltip title="Last page">
            <IconButton
              onClick={handleLastPage}
              disabled={currentPage === totalPages}
              size="small"
              sx={{
                color: currentPage === totalPages ? 'text.disabled' : 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                },
              }}
            >
              <LastPage />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Page info */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
          {totalPages > 1 && (
            <span style={{ marginLeft: 8, color: '#6b7280' }}>
              • {Math.ceil((currentPage / totalPages) * 100)}% complete
            </span>
          )}
        </Typography>
      </Box>
    </Paper>
  );
}
