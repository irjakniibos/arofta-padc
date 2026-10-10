/**
 * Isi dokumen Kebijakan Privasi dan Persetujuan Layanan Psikologi (informed consent).
 * Versi harus sama dengan VERSI_PERSETUJUAN di backend (src/config/constants.js).
 * Bila isi diubah, naikkan versi di kedua tempat agar pengguna diminta menyetujui ulang.
 * Draf ini perlu ditinjau psikolog AROFTA PADC (Kode Etik HIMPSI) sebelum dipakai resmi.
 */

export const BERLAKU = '10 Oktober 2026';

export const KEBIJAKAN_PRIVASI = {
  versi: '1.0',
  judul: 'Kebijakan Privasi',
  pembuka: 'Kebijakan ini menjelaskan bagaimana AROFTA Psychological Assessment and Development Center (AROFTA PADC) mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda saat memakai sistem layanan ini, sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.',
  bagian: [
    {
      judul: 'Data yang kami kumpulkan',
      isi: [
        'Data akun: nama, alamat email, nomor HP/WhatsApp, dan password yang disimpan dalam bentuk terenkripsi (hash).',
        'Data profil dan formulir: identitas diri, pendidikan, pekerjaan, susunan keluarga, riwayat kesehatan, serta riwayat kelahiran dan perkembangan untuk profil anak.',
        'Data layanan: jadwal, status pembayaran, catatan pemeriksaan psikolog, dan laporan hasil pemeriksaan.',
        'Data teknis: alamat IP dan catatan aktivitas penting, untuk keamanan sistem.',
        'Data psikologis dan kesehatan termasuk data pribadi yang bersifat spesifik, sehingga kami memprosesnya dengan perlindungan tambahan.',
      ],
    },
    {
      judul: 'Tujuan penggunaan data',
      isi: [
        'Menyelenggarakan layanan asesmen dan konseling psikologi yang Anda pesan.',
        'Mengatur jadwal, mengirim pengingat, dan memverifikasi pembayaran.',
        'Menyusun dan menyampaikan laporan hasil pemeriksaan kepada pihak yang berhak.',
        'Memenuhi kewajiban hukum dan kode etik profesi psikologi.',
        'Menjaga keamanan sistem dan mencegah penyalahgunaan akun.',
      ],
    },
    {
      judul: 'Siapa yang dapat mengakses data Anda',
      isi: [
        'Anda sendiri, serta orang tua atau wali untuk profil anak.',
        'Psikolog yang menangani sesi Anda.',
        'Pengelola layanan AROFTA PADC yang berwenang, sebatas keperluan administrasi layanan.',
        'Tim pemelihara sistem, sebatas keperluan teknis dan terikat kewajiban menjaga kerahasiaan.',
        'Untuk asesmen rekrutmen yang dipesan oleh instansi atau perusahaan, hasil disampaikan kepada instansi tersebut sesuai kesepakatan layanan.',
        'Kami tidak menjual data Anda. Data hanya diberikan kepada pihak lain bila diwajibkan peraturan perundang-undangan atau atas permintaan Anda.',
      ],
    },
    {
      judul: 'Layanan pihak ketiga',
      isi: [
        'Email notifikasi dikirim melalui penyedia layanan email.',
        'Konfirmasi pembayaran dilakukan melalui WhatsApp atas inisiatif Anda sendiri. Foto bukti transfer yang Anda kirim tersimpan di WhatsApp AROFTA PADC dan tidak disimpan di sistem ini.',
        'Sistem dijalankan pada server yang dikelola dengan kontrol akses terbatas.',
      ],
    },
    {
      judul: 'Penyimpanan dan keamanan',
      isi: [
        'Akses data dibatasi sesuai peran pengguna. Laporan hasil hanya dapat diunduh oleh pihak yang berhak setelah masuk ke akun.',
        'Koneksi ke sistem dienkripsi (HTTPS), password disimpan dalam bentuk hash, dan data dicadangkan secara berkala.',
        'Data disimpan selama diperlukan untuk layanan dan sesuai ketentuan penyimpanan rekam psikologis yang berlaku, kemudian dihapus atau dianonimkan.',
        'Bila terjadi kegagalan pelindungan data, kami akan memberi tahu Anda paling lambat 3 x 24 jam sejak kejadian diketahui.',
      ],
    },
    {
      judul: 'Hak Anda',
      isi: [
        'Mendapatkan informasi dan salinan data pribadi Anda.',
        'Memperbarui atau memperbaiki data yang tidak akurat. Sebagian besar data dapat Anda ubah sendiri di menu Profil.',
        'Menarik persetujuan dan meminta penghapusan data, dengan batasan kewajiban penyimpanan rekam psikologis.',
        'Mengajukan keberatan atas pemrosesan data.',
        'Permintaan diajukan melalui kontak di bawah dan akan kami tanggapi paling lambat 3 x 24 jam.',
      ],
    },
    {
      judul: 'Data anak',
      isi: [
        'Data anak hanya diberikan dan dikelola oleh orang tua atau wali yang sah melalui akunnya. Dengan menambahkan profil anak, orang tua atau wali menyatakan memberi persetujuan atas pemrosesan data anak tersebut.',
      ],
    },
    {
      judul: 'Perubahan kebijakan',
      isi: [
        'Bila kebijakan ini berubah, versi dokumen akan diperbarui dan Anda akan diminta menyetujui kembali saat masuk ke akun.',
      ],
    },
  ],
};

export const PERSETUJUAN_LAYANAN = {
  versi: '1.0',
  judul: 'Persetujuan Layanan Psikologi',
  pembuka: 'Dokumen ini menjelaskan hal-hal yang perlu Anda ketahui sebelum menerima layanan asesmen atau konseling psikologi di AROFTA PADC. Dengan mencentang persetujuan saat booking, Anda menyatakan telah membaca, memahami, dan menyetujui isi dokumen ini.',
  bagian: [
    {
      judul: 'Layanan yang diberikan',
      isi: [
        'Layanan diberikan oleh psikolog yang memiliki Surat Izin Praktik Psikologi (SIPP), berupa asesmen (tes psikologi, wawancara, observasi) atau konseling sesuai layanan yang dipilih.',
        'Hasil asesmen menggambarkan kondisi psikologis pada saat pemeriksaan dan disampaikan dalam laporan tertulis yang dapat diunduh di dashboard.',
      ],
    },
    {
      judul: 'Kerahasiaan',
      isi: [
        'Seluruh informasi yang Anda sampaikan dijaga kerahasiaannya sesuai Kode Etik Psikologi Indonesia (HIMPSI).',
        'Kerahasiaan dapat dibuka hanya bila ada risiko serius membahayakan diri sendiri atau orang lain, dugaan kekerasan terhadap anak, atau diwajibkan oleh hukum dan putusan pengadilan.',
        'Psikolog dapat mendiskusikan kasus dengan rekan profesional untuk menjaga mutu layanan tanpa menyebutkan identitas Anda.',
      ],
    },
    {
      judul: 'Hak dan tanggung jawab klien',
      isi: [
        'Anda berhak bertanya tentang tujuan dan proses layanan, serta berhak menolak atau menghentikan layanan.',
        'Anda bertanggung jawab memberikan informasi yang benar, hadir sesuai jadwal, dan menyelesaikan pembayaran.',
        'Sesi daring diikuti dari tempat yang tenang dan pribadi. Sesi tidak boleh direkam tanpa persetujuan kedua pihak.',
      ],
    },
    {
      judul: 'Layanan untuk anak',
      isi: [
        'Persetujuan untuk anak diberikan oleh orang tua atau wali yang sah. Hasil pemeriksaan anak disampaikan kepada orang tua atau wali tersebut.',
      ],
    },
    {
      judul: 'Pembayaran, pembatalan, dan jadwal ulang',
      isi: [
        'Pembayaran melalui transfer ke rekening AROFTA PADC dan dikonfirmasi melalui WhatsApp sebelum batas waktu. Booking yang tidak dibayar sampai batas waktu dibatalkan otomatis.',
        'Booking yang belum dibayar dapat dibatalkan sendiri di dashboard. Pembatalan, jadwal ulang, atau pengembalian dana setelah pembayaran diajukan melalui admin.',
      ],
    },
    {
      judul: 'Bukan layanan darurat',
      isi: [
        'Layanan ini bukan layanan krisis atau gawat darurat. Bila Anda atau orang di sekitar Anda dalam bahaya, segera hubungi 112 atau datang ke IGD rumah sakit terdekat.',
      ],
    },
  ],
};
