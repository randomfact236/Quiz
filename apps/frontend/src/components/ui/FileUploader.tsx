'use client';

import { Upload, CheckCircle, AlertTriangle, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    label?: string;
    description?: string;
    maxSizeMB?: number;
    className?: string;
}

export function FileUploader({
    onFileSelect,
    accept = '.json,.csv',
    label = 'Upload file',
    description = 'Drag and drop your JSON or CSV file here, or click to browse',
    maxSizeMB = 5,
    className,
}: FileUploaderProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────

    function getExtension(name: string): string {
        const parts = name.split('.');
        if (parts.length < 2) {return '';}
        return '.' + (parts[parts.length - 1] ?? '').toLowerCase();
    }

    function isFileAllowed(file: File): boolean {
        if (!accept) {return true;}

        const ext = getExtension(file.name);
        const mime = (file.type || '').toLowerCase();
        const allowed = accept.split(',').map(s => s.trim().toLowerCase());

        // 1. Extension match
        if (ext && allowed.includes(ext)) {return true;}

        // 2. MIME‑type fuzzy match (covers edge cases where OS sets an unexpected MIME)
        if (mime) {
            if (allowed.includes('.json') && (mime.includes('json') || mime === 'text/plain')) {return true;}
            if (allowed.includes('.csv') && (mime.includes('csv') || mime.includes('excel') || mime === 'text/plain')) {return true;}
        }

        return false;
    }

    function processFile(file: File) {
        setError(null);

        if (!isFileAllowed(file)) {
            setError(`Invalid file type. Allowed: ${accept}`);
            return;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File is too large (max ${maxSizeMB}MB)`);
            return;
        }

        setSelectedFile(file);
        onFileSelect(file);
    }

    // ── Event Handlers (NO useCallback – avoids stale‑closure bugs) ─────────

    function handleDragEnter(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        // Must set dropEffect so the browser shows the correct cursor
        e.dataTransfer.dropEffect = 'copy';
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {processFile(file);}
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {processFile(file);}
        // Reset input so the same file can be re‑selected
        if (inputRef.current) {inputRef.current.value = '';}
    }

    function handleRemove(e: React.MouseEvent) {
        e.stopPropagation();
        setSelectedFile(null);
        setError(null);
        if (inputRef.current) {inputRef.current.value = '';}
    }

    function handleZoneClick() {
        inputRef.current?.click();
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className={cn('w-full', className)}>
            <div
                role="button"
                tabIndex={0}
                className={cn(
                    'relative flex flex-col items-center justify-center w-full min-h-[160px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
                    isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800',
                    error ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : ''
                )}
                onClick={handleZoneClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') {handleZoneClick();} }}
            >
                {/* Hidden native input */}
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={handleInputChange}
                    accept={accept}
                    aria-label={label}
                />

                {selectedFile ? (
                    <div className="flex flex-col items-center text-center p-4">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 mb-3">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center p-4">
                        <div className={cn(
                            'p-3 rounded-full mb-3',
                            error ? 'bg-red-100 text-red-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        )}>
                            {error ? <AlertTriangle className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                        </div>
                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {error ? 'Upload failed' : label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                            {error || description}
                        </p>
                        <p className="text-xs text-gray-400 mt-4">
                            Supported: {accept.replace(/\./g, '').toUpperCase()}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
