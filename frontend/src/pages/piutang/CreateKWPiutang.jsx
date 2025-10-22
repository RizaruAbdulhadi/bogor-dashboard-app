import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Form, Input, Button, Select, DatePicker, message, Card, Divider, Space } from 'antd';
import MainLayout from '../../layouts/MainLayout';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs'; // ✅ tambahkan ini

const { Option } = Select;
const { TextArea } = Input;

function CreateKWPiutang() {
    const [form] = Form.useForm();
    const [rekeningList, setRekeningList] = useState([]);
    const [pimpinanList, setPimpinanList] = useState([]);
    const [outletList, setOutletList] = useState([]);
    const [debiturList, setDebiturList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load master data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [rekening, pimpinan, outlet, debitur] = await Promise.all([
                    axios.get('/api/rekening'),
                    axios.get('/api/pimpinan'),
                    axios.get('/api/outlet'),
                    axios.get('/api/debitur')
                ]);

                setRekeningList(rekening.data);
                setPimpinanList(pimpinan.data);
                setOutletList(outlet.data);
                setDebiturList(debitur.data);
            } catch (error) {
                message.error('Gagal memuat data master');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Generate terbilang
    const generateTerbilang = (angka) => {
        if (!angka || isNaN(angka)) return "";

        const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan"];
        const belasan = ["Sepuluh", "Sebelas", "Dua Belas", "Tiga Belas", "Empat Belas", "Lima Belas",
            "Enam Belas", "Tujuh Belas", "Delapan Belas", "Sembilan Belas"];

        const convert = (n) => {
            if (n < 10) return satuan[n];
            if (n < 20) return belasan[n - 10];
            if (n < 100) return `${satuan[Math.floor(n/10)]} Puluh ${convert(n % 10)}`.trim();
            if (n < 200) return `Seratus ${convert(n - 100)}`.trim();
            if (n < 1000) return `${satuan[Math.floor(n/100)]} Ratus ${convert(n % 100)}`.trim();
            if (n < 2000) return `Seribu ${convert(n - 1000)}`.trim();
            if (n < 1000000) return `${convert(Math.floor(n/1000))} Ribu ${convert(n % 1000)}`.trim();
            if (n < 1000000000) return `${convert(Math.floor(n/1000000))} Juta ${convert(n % 1000000)}`.trim();
            return "Terlalu besar";
        };

        const result = convert(parseInt(angka));
        return result ? `${result.toUpperCase()} RUPIAH` : "";
    };

    // Handle nominal input
    const handleNominalChange = (e) => {
        const value = e.target.value.replace(/\./g, '');
        form.setFieldsValue({
            nominal: value,
            terbilang: generateTerbilang(value)
        });
    };

    // Reset form
    const handleReset = () => {
        form.resetFields();
        message.success('Form telah direset');
    };

    // Submit form
    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const payload = {
                ...values,
                tanggal: values.tanggal ? dayjs(values.tanggal).format('YYYY-MM-DD') : null,
                tanggal_pelayanan: values.tanggal_pelayanan ? dayjs(values.tanggal_pelayanan).format('YYYY-MM-DD') : null,
                terbilang: generateTerbilang(values.nominal)
            };

            await axios.post('/api/kwitansi/simpan', payload);

            message.success({
                content: '✅ Kwitansi berhasil disimpan!',
                duration: 3,
                style: { marginTop: '50px' }
            });
            form.resetFields();
        } catch (err) {
            console.error('Gagal simpan:', err);
            message.error({
                content: '❌ Gagal menyimpan kwitansi',
                duration: 3,
                style: { marginTop: '50px' }
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto p-4">
                <Card
                    title={<span className="text-xl font-semibold text-gray-800">Form Entri Kwitansi Piutang</span>}
                    bordered={false}
                    className="shadow-lg rounded-lg"
                    loading={loading}
                    extra={
                        <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={submitting}>
                            Reset Form
                        </Button>
                    }
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Kolom Kiri */}
                            <div className="space-y-4">
                                <Form.Item
                                    name="nama_penjamin"
                                    label="Nama Penjamin"
                                    rules={[{ required: true, message: 'Harap pilih penjamin!' }]}
                                >
                                    <Select
                                        placeholder="Pilih Penjamin"
                                        showSearch
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            option.children.toLowerCase().includes(input.toLowerCase())
                                        }
                                        size="large"
                                    >
                                        {debiturList.map(p => (
                                            <Option key={p.id} value={p.nama_debitur}>{p.nama_debitur}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="tanggal"
                                    label="Tanggal Kwitansi"
                                    rules={[{ required: true, message: 'Harap pilih tanggal kwitansi!' }]}
                                >
                                    <DatePicker className="w-full" format="DD/MM/YYYY" size="large" />
                                </Form.Item>

                                {/* ✅ Tambahan field baru */}
                                <Form.Item
                                    name="tanggal_pelayanan"
                                    label="Tanggal Pelayanan"
                                    rules={[{ required: true, message: 'Harap pilih tanggal pelayanan!' }]}
                                >
                                    <DatePicker className="w-full" format="DD/MM/YYYY" size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="nomor_kwitansi"
                                    label="Nomor Kwitansi"
                                    rules={[{ required: true, message: 'Harap isi nomor kwitansi!' }]}
                                >
                                    <Input placeholder="C1xxxxxxxx" size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="nominal"
                                    label="Nominal (Rp)"
                                    rules={[{ required: true, message: 'Harap isi nominal!' }]}
                                >
                                    <Input
                                        type="text"
                                        size="large"
                                        onChange={handleNominalChange}
                                        addonBefore="Rp"
                                    />
                                </Form.Item>
                            </div>

                            {/* Kolom Kanan */}
                            <div className="space-y-4">
                                <Form.Item name="terbilang" label="Terbilang">
                                    <Input readOnly className="italic text-gray-600 bg-gray-50 font-medium" size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="nomor_rekening"
                                    label="Nomor Rekening"
                                    rules={[{ required: true, message: 'Harap pilih rekening!' }]}
                                >
                                    <Select placeholder="Pilih Rekening" size="large">
                                        {rekeningList.map(r => (
                                            <Option key={r.id} value={r.nomor}>{r.bank} - {r.nomor}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="pimpinan"
                                    label="Pimpinan"
                                    rules={[{ required: true, message: 'Harap pilih pimpinan!' }]}
                                >
                                    <Select placeholder="Pilih Pimpinan" size="large">
                                        {pimpinanList.map(p => (
                                            <Option key={p.id} value={p.nama}>{p.nama}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="outlet"
                                    label="Outlet"
                                    rules={[{ required: true, message: 'Harap pilih outlet!' }]}
                                >
                                    <Select placeholder="Pilih Outlet" size="large">
                                        {outletList.map(o => (
                                            <Option key={o.id} value={o.nama_outlet}>{o.nama_outlet}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </div>
                        </div>

                        <Form.Item
                            name="keterangan"
                            label="Keterangan"
                            rules={[{ required: true, message: 'Harap isi keterangan!' }]}
                        >
                            <TextArea rows={3} size="large" placeholder="Masukkan keterangan tambahan..." />
                        </Form.Item>

                        <Divider />

                        <Form.Item className="mb-0">
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={submitting}
                                    icon={<SaveOutlined />}
                                    size="large"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                >
                                    Simpan Kwitansi
                                </Button>
                                <Button onClick={handleReset} icon={<ReloadOutlined />} size="large" disabled={submitting}>
                                    Reset
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </MainLayout>
    );
}

export default CreateKWPiutang;
