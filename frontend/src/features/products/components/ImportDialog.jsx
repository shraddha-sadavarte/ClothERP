// frontend/src/features/products/components/ImportDialog.jsx
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Paper,
    IconButton,
    Alert,
    CircularProgress,
    Divider,
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';

const ImportDialog = ({ open, onClose, onImport, loading }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = (selectedFile) => {
        setError(null);

        const fileName = selectedFile.name.toLowerCase();
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
            setError('Please upload an Excel file (.xlsx or .xls)');
            setFile(null);
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('File size exceeds 5MB limit');
            setFile(null);
            return;
        }

        setFile(selectedFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleImport = () => {
        if (file) {
            onImport(file);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setError(null);
        document.getElementById('file-input').value = '';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Import Products
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Drag & Drop Area */}
                <Paper
                    sx={{
                        border: `2px dashed ${dragOver ? '#1976d2' : '#ccc'}`,
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        backgroundColor: dragOver ? '#e3f2fd' : 'transparent',
                        '&:hover': {
                            borderColor: '#1976d2',
                            backgroundColor: '#f5f5f5',
                        },
                    }}
                    onClick={() => document.getElementById('file-input').click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <input
                        id="file-input"
                        type="file"
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            if (e.target.files.length > 0) {
                                handleFileSelect(e.target.files[0]);
                            }
                        }}
                    />

                    {file ? (
                        <Box>
                            <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="body1" gutterBottom>
                                {file.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {(file.size / 1024).toFixed(2)} KB
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile();
                                    }}
                                >
                                    Remove File
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box>
                            <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="body1" gutterBottom>
                                Drag & drop your Excel file here
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                or click to browse
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Button variant="outlined" size="small">
                                    Browse Files
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Paper>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Format Info */}
                <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                        Required Format:
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 1,
                            bgcolor: '#f5f5f5',
                            p: 2,
                            borderRadius: 1,
                        }}
                    >
                        {['Name*', 'SKU*', 'Category*', 'Size', 'Color', 'Price (₹)*', 'Cost (₹)*', 'Material', 'Description'].map((field) => (
                            <Box
                                key={field}
                                sx={{
                                    p: 1,
                                    bgcolor: field.includes('*') ? '#fff3e0' : '#e8eaf6',
                                    borderRadius: 1,
                                    fontSize: 14,
                                    color: field.includes('*') ? '#e65100' : '#1a237e',
                                    textAlign: 'center',
                                }}
                            >
                                {field}
                            </Box>
                        ))}
                    </Box>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        * Required fields
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={!file || loading}
                    startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                    {loading ? 'Importing...' : 'Import Products'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ImportDialog;