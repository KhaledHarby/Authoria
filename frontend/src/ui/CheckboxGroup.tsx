import React from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
  chip?: {
    label: string;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    variant?: 'filled' | 'outlined';
  };
}

interface CheckboxGroupProps {
  title: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onSelectionChange: (selectedValues: string[]) => void;
  maxHeight?: number;
  showCheckAll?: boolean;
  showChips?: boolean;
  dense?: boolean;
  disabled?: boolean;
}

export default function CheckboxGroup({
  title,
  options,
  selectedValues,
  onSelectionChange,
  maxHeight = 300,
  showCheckAll = true,
  showChips = true,
  dense = true,
  disabled = false,
}: CheckboxGroupProps) {
  const allSelected = options.length > 0 && selectedValues.length === options.length;
  const someSelected = selectedValues.length > 0 && selectedValues.length < options.length;

  const handleCheckAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(options.map(option => option.value));
    }
  };

  const handleOptionToggle = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newSelection);
  };

  const getChipColor = (option: CheckboxOption) => {
    if (option.chip?.color) return option.chip.color;
    
    // Default color logic based on value
    const value = option.value.toLowerCase();
    if (value.includes('delete') || value.includes('admin')) return 'error';
    if (value.includes('create') || value.includes('update')) return 'warning';
    if (value.includes('export') || value.includes('view')) return 'info';
    if (value.includes('configure')) return 'secondary';
    return 'default';
  };

  if (options.length === 0) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No options available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {title}
        </Typography>
        {showCheckAll && options.length > 1 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleCheckAll}
              disabled={disabled}
              sx={{ 
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                textTransform: 'none',
              }}
            >
              {allSelected ? 'Uncheck All' : 'Check All'}
            </Button>
            {someSelected && (
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                {selectedValues.length} of {options.length} selected
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <List sx={{ maxHeight, overflow: 'auto', p: 0 }}>
          {options.map((option, index) => (
            <React.Fragment key={option.value}>
              <ListItem 
                dense={dense}
                disabled={disabled}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  cursor: disabled ? 'default' : 'pointer',
                }}
                onClick={() => !disabled && handleOptionToggle(option.value)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleOptionToggle(option.value)}
                    disabled={disabled}
                    icon={<CheckBoxOutlineBlank />}
                    checkedIcon={<CheckBox />}
                    sx={{
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.label}
                      </Typography>
                      {showChips && option.chip && (
                        <Chip
                          label={option.chip.label}
                          size="small"
                          color={getChipColor(option)}
                          variant={option.chip.variant || 'outlined'}
                          sx={{ fontSize: '0.625rem', height: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )
                  }
                />
              </ListItem>
              {index < options.length - 1 && (
                <Divider component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {selectedValues.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Selected: {selectedValues.length} of {options.length}
          </Typography>
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
            ({Math.round((selectedValues.length / options.length) * 100)}%)
          </Typography>
        </Box>
      )}
    </Box>
  );
}
