import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  useTheme,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon,
  Refresh as RefreshIcon,
  Translate as TranslateIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import Layout from '../../ui/Layout';
import Pagination from '../../ui/Pagination';
import SearchBar from '../../ui/SearchBar';
import { localizationApi } from '../../api/localizationApi';
import type { LocalizationLabel, LocalizationAnalytics, PaginationRequest } from '../../types/localization';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

export default function LocalizationPage() {
  const theme = useTheme();
  const { tenantId } = useSelector((state: RootState) => state.auth);
  
  // State management
  const [translations, setTranslations] = useState<LocalizationLabel[]>([]);
  const [analytics, setAnalytics] = useState<LocalizationAnalytics | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'edit'>('create');
  const [selectedTranslation, setSelectedTranslation] = useState<LocalizationLabel | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    language: '',
    value: '',
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('language');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [languageFilter, setLanguageFilter] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTranslations();
  }, [currentPage, pageSize, searchTerm, sortBy, sortDirection, languageFilter]);

  const loadData = async () => {
    try {
      setPageLoading(true);
      const [analyticsData, languagesData] = await Promise.all([
        localizationApi.getAnalytics(),
        localizationApi.getSupportedLanguages()
      ]);
      setAnalytics(analyticsData.data);
      setSupportedLanguages(languagesData.data);
    } catch (err: any) {
      setError('Failed to load localization data: ' + (err.response?.data?.message || err.message));
    } finally {
      setPageLoading(false);
    }
  };

  const loadTranslations = async () => {
    try {
      const request: PaginationRequest = {
        page: currentPage,
        pageSize,
        searchTerm: languageFilter ? `${languageFilter} ${searchTerm}`.trim() : searchTerm,
        sortBy,
        sortDirection,
      };
      
      const response = await localizationApi.getPaginated(request);
      setTranslations(response.data.items);
      setTotalCount(response.data.totalCount);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      setError('Failed to load translations: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleLanguageFilterChange = (language: string) => {
    setLanguageFilter(language);
    setCurrentPage(1);
  };

  const handleOpenDialog = (type: 'create' | 'edit', translation?: LocalizationLabel) => {
    setDialogType(type);
    setSelectedTranslation(translation || null);
    if (type === 'edit' && translation) {
      setFormData({
        key: translation.key,
        language: translation.language,
        value: translation.value,
      });
    } else {
      setFormData({
        key: '',
        language: '',
        value: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTranslation(null);
    setFormData({
      key: '',
      language: '',
      value: '',
    });
  };

  const handleSave = async () => {
    if (!formData.key.trim() || !formData.language.trim() || !formData.value.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (dialogType === 'create') {
        await localizationApi.create({
          ...formData,
          tenantId: tenantId || undefined
        });
        setSuccess('Translation created successfully!');
      } else if (selectedTranslation) {
        await localizationApi.update(selectedTranslation.id, {
          id: selectedTranslation.id,
          ...formData,
          tenantId: tenantId || undefined
        });
        setSuccess('Translation updated successfully!');
      }

      await loadTranslations();
      await loadData();
      
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save translation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this translation?')) return;

    try {
      await localizationApi.delete(id);
      setSuccess('Translation deleted successfully!');
      await loadTranslations();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete translation.');
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      await localizationApi.downloadTranslations();
      setSuccess('Translations exported successfully!');
    } catch (err: any) {
      setError('Failed to export translations.');
    } finally {
      setLoading(false);
    }
  };

  const getLanguageColor = (language: string) => {
    switch (language.toLowerCase()) {
      case 'en': return '#3b82f6';
      case 'ar': return '#8b5cf6';
      case 'fr': return '#ef4444';
      case 'es': return '#f59e0b';
      case 'de': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      'en': 'English',
      'ar': 'العربية',
      'fr': 'Français',
      'es': 'Español',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'zh': '中文',
      'ja': '日本語',
      'ko': '한국어'
    };
    return names[code] || code;
  };

  if (pageLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box>
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                mb: 1
              }}
            >
              Localization Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage translations and language settings
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Refresh">
              <IconButton 
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <RefreshIcon sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                },
              }}
            >
              Add Translation
            </Button>
          </Box>
        </Box>

        {/* Analytics Cards */}
        {analytics && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LanguageIcon />
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                    Total Languages
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {analytics.totalLanguages}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Supported languages
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TranslateIcon color="success" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Keys
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {analytics.totalKeys}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Translation keys
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TranslateIcon color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Translations
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {analytics.totalTranslations}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All translations
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DownloadIcon color="warning" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Export
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    },
                  }}
                >
                  {loading ? 'Exporting...' : 'Export All'}
                </Button>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, alignItems: 'center' }}>
            <Box>
              <SearchBar
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search translations by key, value, or language..."
                loading={refreshing}
              />
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <MenuItem value="language">Language</MenuItem>
                <MenuItem value="key">Key</MenuItem>
                <MenuItem value="value">Value</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Language</InputLabel>
              <Select
                value={languageFilter}
                label="Language"
                onChange={(e) => handleLanguageFilterChange(e.target.value)}
              >
                <MenuItem value="">All Languages</MenuItem>
                {supportedLanguages.map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {getLanguageName(lang)} ({lang})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Translations Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Language</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {translations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <TranslateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h5" color="text.secondary" gutterBottom>
                            No translations found
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {searchTerm || languageFilter 
                              ? 'Try adjusting your search criteria or filters'
                              : 'Get started by creating your first translation'
                            }
                          </Typography>
                          {!searchTerm && !languageFilter && (
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => handleOpenDialog('create')}
                              sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                                },
                              }}
                            >
                              Create First Translation
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    translations.map((translation) => (
                      <TableRow key={translation.id} hover>
                        <TableCell>
                          <Chip
                            label={`${getLanguageName(translation.language)} (${translation.language})`}
                            size="small"
                            sx={{
                              bgcolor: getLanguageColor(translation.language),
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                            {translation.key}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {translation.value}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit translation">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('edit', translation)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete translation">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(translation.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}

        {/* Create/Edit Translation Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {dialogType === 'create' ? 'Create New Translation' : 'Edit Translation'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={formData.language}
                  label="Language"
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                >
                  {supportedLanguages.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {getLanguageName(lang)} ({lang})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Translation Key"
                placeholder="e.g., common.save"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                helperText="Use dot notation (e.g., section.key)"
              />
              <TextField
                fullWidth
                label="Translation Value"
                multiline
                rows={3}
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Enter the translated text"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                },
              }}
            >
              {loading ? (dialogType === 'create' ? 'Creating...' : 'Updating...') : (dialogType === 'create' ? 'Create Translation' : 'Save Changes')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}

