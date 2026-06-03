# Hướng dẫn cho AI / Agent (Agent Instructions)

Đây là bộ quy tắc bắt buộc mà Agent phải tuân thủ trong quá trình làm việc với dự án này.

## Quy tắc 1: Cập nhật nhật ký (Log) vào thư mục `agent_log/`
Bất cứ khi nào Agent thực hiện **thêm, sửa, hoặc xóa** code, file, cấu hình... Agent **BẮT BUỘC** phải:
1. Mô tả sơ qua bằng lời (chat) cho người dùng về những thay đổi vừa làm.
2. Tạo một file log mới bên trong thư mục `agent_log/` để lưu lại chi tiết những thay đổi đó.

## Quy tắc 2: Quy chuẩn đặt tên file log
Tất cả các file log khi tạo mới trong thư mục `agent_log/` phải tuân theo cấu trúc đặt tên thống nhất:
**`YYYY-MM-DD_HH-MM_[Hanh-Dong-Ngan-Gon].md`**

**Ví dụ:**
- `2026-05-24_10-30_khoi-tao-database.md`
- `2026-05-24_14-15_tao-api-danh-sach-ban.md`
- `2026-05-25_09-00_fix-bug-socket-io.md`

### Nội dung chuẩn của một file log:
Mỗi file log cần bao gồm các phần sau:
- **Thời gian thực hiện**: (Giờ, phút)
- **Tóm tắt hành động**: (Mô tả ngắn gọn mục đích)
- **Danh sách file bị ảnh hưởng**: (Các file được tạo mới, chỉnh sửa, hoặc xóa)
- **Chi tiết thay đổi/Lệnh đã chạy**: (Tùy chọn ghi chú thêm các module đã cài, hoặc câu lệnh `npm install`, v.v.)

## Quy tắc 3: Giải thích trước, hành động sau
Nếu nhận được yêu cầu phức tạp, hãy xác nhận lại cách làm hoặc giải thích ngắn gọn hướng giải quyết trước khi trực tiếp tạo hay sửa file (trừ trường hợp người dùng yêu cầu làm ngay lập tức).
