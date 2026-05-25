require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Tạo HTTP server
const server = http.createServer(app);

// Khởi tạo Socket.io server
const io = new Server(server, {
    cors: {
        origin: '*', // Trong thực tế nên giới hạn lại theo domain
        methods: ['GET', 'POST']
    }
});

// Chèn biến io vào express app để dùng trong các controllers
app.set('io', io);

// Lắng nghe sự kiện Socket.io
io.on('connection', (socket) => {
    console.log('⚡ Client đã kết nối Socket.io:', socket.id);

    // Join room theo bàn (Dành cho khách hàng)
    socket.on('join_table', (tableCode) => {
        socket.join(`table:${tableCode}`);
        console.log(`✅ Socket ${socket.id} đã vào room bàn: table:${tableCode}`);
    });

    // Join room staff (Dành cho nhân viên, bếp, thu ngân)
    socket.on('join_staff', () => {
        socket.join('staff');
        console.log(`✅ Socket ${socket.id} đã vào room: staff`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Client đã ngắt kết nối:', socket.id);
    });
});



// Khởi động server
server.listen(PORT, async () => {
    console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
    // Kiểm tra kết nối DB khi khởi động
    await testConnection();
});
