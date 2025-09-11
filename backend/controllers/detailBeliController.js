const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const DetailBeli = require('../models/DetailBeli');
const UploadedFile = require('../models/UploadedFile');

// Helper function untuk membersihkan nilai
const cleanValue = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return null;
        return trimmed;
    }
    return value;
};

// Helper function untuk parsing tanggal
const parseDate = (excelDate) => {
    if (!excelDate) return null;

    // Jika sudah berupa Date object
    if (excelDate instanceof Date) {
        return excelDate;
    }

    // Jika berupa number (format Excel)
    if (typeof excelDate === 'number') {
        return XLSX.SSF.parse_date_code(excelDate);
    }

    // Jika berupa string
    if (typeof excelDate === 'string') {
        // Coba parsing berbagai format tanggal
        const formats = [
            'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY',
            'DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY/MM/DD'
        ];

        for (const format of formats) {
            try {
                const date = new Date(excelDate);
                if (!isNaN(date.getTime())) return date;
            } catch (error) {
                continue;
            }
        }
    }

    return null;
};

// Upload dan proses file Excel
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada file yang diupload'
            });
        }

        // Simpan informasi file ke database
        const uploadedFile = await UploadedFile.create({
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            status: 'processing'
        });

        // Proses file Excel secara asynchronous
        processExcelFile(uploadedFile);

        res.json({
            success: true,
            message: 'File berhasil diupload dan sedang diproses',
            fileId: uploadedFile.id
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengupload file',
            error: error.message
        });
    }
};

// Fungsi untuk memproses file Excel
const processExcelFile = async (uploadedFile) => {
    try {
        const workbook = XLSX.readFile(uploadedFile.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Konversi ke JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (data.length <= 1) {
            throw new Error('File Excel tidak memiliki data');
        }

        const headers = data[0].map(header => header ? header.toString().trim().toLowerCase() : '');
        const rows = data.slice(1);

        await uploadedFile.update({
            total_rows: rows.length,
            status: 'processing'
        });

        let processedCount = 0;
        const batchSize = 100;
        let batch = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const rowData = {};

            // Mapping kolom berdasarkan header
            headers.forEach((header, index) => {
                if (header && index < row.length) {
                    const value = cleanValue(row[index]);

                    // Mapping khusus untuk field tertentu
                    switch (header) {
                        case 'tanggal_penerimaan':
                        case 'tanggal_terima_fisik_faktur':
                        case 'exp_date':
                        case 'tanggal_po':
                            rowData[header] = parseDate(value);
                            break;
                        case 'qty_beli':
                        case 'isi_obat':
                        case 'quantity_po':
                            rowData[header] = value ? parseInt(value) : null;
                            break;
                        case 'harga_satuan':
                        case 'diskon_beli_1':
                        case 'diskon_beli_2':
                        case 'diskon_beli_3':
                        case 'jumlah_diskon':
                        case 'jumlah_netto':
                        case 'diskon_po_1':
                        case 'diskon_po_2':
                        case 'diskon_po_3':
                            rowData[header] = value ? parseFloat(value) : null;
                            break;
                        default:
                            rowData[header] = value;
                    }
                }
            });

            batch.push(rowData);
            processedCount++;

            // Insert batch setiap 100 records
            if (batch.length >= batchSize || i === rows.length - 1) {
                try {
                    await DetailBeli.bulkCreate(batch, {
                        validate: true,
                        ignoreDuplicates: true
                    });

                    await uploadedFile.update({
                        processed_rows: processedCount
                    });

                    batch = [];
                } catch (batchError) {
                    console.error('Error inserting batch:', batchError);
                    // Continue dengan batch berikutnya
                    batch = [];
                }
            }
        }

        await uploadedFile.update({
            status: 'completed',
            processed_rows: processedCount
        });

        console.log(`File ${uploadedFile.originalname} berhasil diproses: ${processedCount} records`);

    } catch (error) {
        console.error('Error processing file:', error);
        await uploadedFile.update({
            status: 'failed',
            error_message: error.message
        });
    }
};

// Get semua uploaded files
const getUploadedFiles = async (req, res) => {
    try {
        const files = await UploadedFile.findAll({
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: files
        });

    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data file',
            error: error.message
        });
    }
};

// Download file
const downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await UploadedFile.findByPk(id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan'
            });
        }

        if (!fs.existsSync(file.path)) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan di server'
            });
        }

        res.download(file.path, file.originalname);

    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mendownload file',
            error: error.message
        });
    }
};

// Delete file
const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await UploadedFile.findByPk(id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan'
            });
        }

        // Hapus file dari filesystem
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Hapus record dari database
        await file.destroy();

        res.json({
            success: true,
            message: 'File berhasil dihapus'
        });

    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menghapus file',
            error: error.message
        });
    }
};

// Get file status
const getFileStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await UploadedFile.findByPk(id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: {
                status: file.status,
                processed_rows: file.processed_rows,
                total_rows: file.total_rows,
                error_message: file.error_message
            }
        });

    } catch (error) {
        console.error('Error getting file status:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil status file',
            error: error.message
        });
    }
};

module.exports = {
    uploadFile,
    getUploadedFiles,
    downloadFile,
    deleteFile,
    getFileStatus
};