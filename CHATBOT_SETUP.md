# ChatBot Setup Guide

## Cấu hình AI API Keys

Để sử dụng tính năng ChatBot, bạn cần cấu hình API keys cho các AI providers.

### 1. Tạo file `.env` (nếu chưa có)

Tạo file `.env` ở thư mục root của project:

```bash
touch .env
```

### 2. Thêm API Keys

Thêm các API keys sau vào file `.env`:

```env
# Gemini API Key (Google AI)
GOOGLE_API_KEY=your_gemini_api_key_here

# Groq API Key
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Lấy API Keys

#### Gemini (Google AI)
1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập với Google account
3. Click "Create API Key"
4. Copy API key và paste vào file `.env`

#### Groq
1. Truy cập: https://console.groq.com/keys
2. Đăng ký/Đăng nhập
3. Click "Create API Key"
4. Copy API key và paste vào file `.env`

### 4. Restart App

Sau khi thêm API keys, restart ứng dụng:

```bash
npm run dev
```

## Sử dụng ChatBot

1. Mở trang **Agent** trong ứng dụng
2. Chọn AI Provider (Gemini hoặc Groq)
3. Chọn Model
4. Bắt đầu chat!

## Tính năng

- ✅ Chat với AI (Gemini & Groq)
- ✅ Streaming responses real-time
- ✅ Markdown rendering
- ✅ Code syntax highlighting
- ✅ Copy code blocks
- ✅ Chuyển đổi providers
- ✅ Chọn models khác nhau
- ✅ Regenerate responses
- ✅ Clear chat history

## Troubleshooting

### Lỗi: "Cannot read properties of undefined"
- Đảm bảo bạn đã restart app sau khi thêm API keys
- Kiểm tra xem file `.env` có nằm ở đúng vị trí (root project)

### Lỗi: API Key không hợp lệ
- Kiểm tra lại API key đã copy đúng chưa
- Đảm bảo không có khoảng trắng thừa trong file `.env`

### Models không load
- Kiểm tra kết nối internet
- Verify API key còn hạn sử dụng

## Notes

- File `.env` đã được thêm vào `.gitignore` để bảo mật
- Không chia sẻ API keys với người khác
- Gemini có free tier với giới hạn 60 requests/minute
- Groq có free tier với tốc độ inference rất nhanh
