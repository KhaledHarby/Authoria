import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Chip,
  Collapse,
  Typography,
  Button,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Tune as TuneIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  showFilters?: boolean;
  filters?: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (value: string) => void;
  }[];
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  loading?: boolean;
  debounceMs?: number;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  onSearch,
  showFilters = false,
  filters = [],
  suggestions = [],
  onSuggestionClick,
  loading = false,
  debounceMs = 300,
}: SearchBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      if (onSearch) {
        onSearch(value);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, onSearch, debounceMs]);

  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  const handleFilterChange = (filterIndex: number, newValue: string) => {
    if (filters[filterIndex]) {
      filters[filterIndex].onChange(newValue);
    }
  };

  const activeFiltersCount = filters.filter(f => f.value).length;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: { xs: 1, sm: 2 },
          backgroundColor: 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
          },
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
          },
        }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack 
            direction={isMobile ? "column" : "row"} 
            spacing={1} 
            alignItems={isMobile ? "stretch" : "center"}
          >
            <TextField
              fullWidth
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon 
                      sx={{ 
                        color: loading ? 'primary.main' : 'text.secondary',
                        fontSize: { xs: '1.25rem', sm: '1.125rem' },
                        animation: loading ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                          '100%': { opacity: 1 },
                        },
                      }} 
                    />
                  </InputAdornment>
                ),
                endAdornment: value && (
                  <InputAdornment position="end">
                    <Tooltip title="Clear search">
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        onClick={handleClear}
                        sx={{ 
                          color: 'text.secondary',
                          p: { xs: 1, sm: 0.5 }
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
                sx: {
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1rem', sm: '0.875rem' },
                    fontWeight: 500,
                    py: { xs: 1.5, sm: 1 },
                  },
                },
              }}
            />

            {showFilters && (
              <Tooltip title={`Filters (${activeFiltersCount} active)`}>
                <IconButton
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  sx={{
                    color: activeFiltersCount > 0 ? 'primary.main' : 'text.secondary',
                    backgroundColor: activeFiltersCount > 0 ? 'primary.light' : 'transparent',
                    p: { xs: 1.5, sm: 1 },
                    minWidth: { xs: 'auto', sm: '40px' },
                    minHeight: { xs: '48px', sm: '40px' },
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                    },
                  }}
                >
                  <FilterIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.125rem' } }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <Box sx={{ 
              mt: { xs: 1.5, sm: 1 }, 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: { xs: 0.75, sm: 1 } 
            }}>
              {filters.map((filter, index) => 
                filter.value && (
                  <Chip
                    key={index}
                    label={`${filter.label}: ${filter.options.find(opt => opt.value === filter.value)?.label || filter.value}`}
                    size={isMobile ? "medium" : "small"}
                    onDelete={() => handleFilterChange(index, '')}
                    deleteIcon={<CloseIcon />}
                    sx={{
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      fontSize: { xs: '0.875rem', sm: '0.75rem' },
                      height: { xs: '32px', sm: '24px' },
                      '& .MuiChip-deleteIcon': {
                        color: 'primary.contrastText',
                        fontSize: { xs: '1.125rem', sm: '1rem' },
                        '&:hover': {
                          color: 'error.light',
                        },
                      },
                    }}
                  />
                )
              )}
            </Box>
          )}

          {/* Filters Panel */}
          <Collapse in={showFiltersPanel}>
            <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  fontSize: { xs: '1rem', sm: '0.875rem' }
                }}
              >
                Filters
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(auto-fit, minmax(200px, 1fr))' 
                }, 
                gap: { xs: 1.5, sm: 2 } 
              }}>
                {filters.map((filter, index) => (
                  <Box key={index}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 500, 
                        color: 'text.secondary', 
                        mb: 0.5, 
                        display: 'block',
                        fontSize: { xs: '0.875rem', sm: '0.75rem' }
                      }}
                    >
                      {filter.label}
                    </Typography>
                    <TextField
                      select
                      size={isMobile ? "medium" : "small"}
                      value={filter.value}
                      onChange={(e) => handleFilterChange(index, e.target.value)}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: { xs: '1rem', sm: '0.875rem' },
                        },
                      }}
                    >
                      <option value="">All</option>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </TextField>
                  </Box>
                ))}
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Paper>

      {/* Search Suggestions */}
      <Collapse in={showSuggestions && suggestions.length > 0}>
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 1,
            maxHeight: { xs: 300, sm: 200 },
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: { xs: 1, sm: 2 },
          }}
        >
          {suggestions.map((suggestion, index) => (
            <Box
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              sx={{
                p: { xs: 2, sm: 1.5 },
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                minHeight: { xs: '48px', sm: '40px' },
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '1rem', sm: '0.875rem' }
                }}
              >
                {suggestion}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Collapse>
    </Box>
  );
}
