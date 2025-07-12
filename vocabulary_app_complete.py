#!/usr/bin/env python3
"""
English Vocabulary Helper - All-in-One Version with Google Drive
Author: Nguyễn Minh Nhựt
Price: 5,000 VND/use/10 words

Run this in Google Colab or locally:
- Google Colab: Just run all cells
- Local: pip install gradio requests google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
"""

import os
import sys
import json
import re
from datetime import datetime
import tempfile
import platform

# Check environment
IS_COLAB = 'google.colab' in sys.modules

# Install required packages if needed
try:
    import gradio as gr
    import requests
except ImportError:
    print("Installing required packages...")
    os.system(f"{sys.executable} -m pip install gradio requests")
    import gradio as gr
    import requests

# Google Drive setup
DRIVE_INTEGRATION = False
drive_service = None

if IS_COLAB:
    try:
        from google.colab import drive, auth
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        
        print("🔗 Mounting Google Drive...")
        drive.mount('/content/drive')
        
        # Authenticate for Drive API
        auth.authenticate_user()
        drive_service = build('drive', 'v3')
        DRIVE_INTEGRATION = True
        print("✅ Google Drive connected!")
    except Exception as e:
        print(f"⚠️ Google Drive not available: {e}")
else:
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        
        # For local, you need service account credentials
        if os.path.exists('credentials.json'):
            credentials = service_account.Credentials.from_service_account_file(
                'credentials.json',
                scopes=['https://www.googleapis.com/auth/drive']
            )
            drive_service = build('drive', 'v3', credentials=credentials)
            DRIVE_INTEGRATION = True
            print("✅ Google Drive connected via service account!")
    except:
        print("ℹ️ Running without Google Drive integration")

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_API_KEY_HERE")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent"

# If in Colab, use Drive path, otherwise use local temp
if IS_COLAB and DRIVE_INTEGRATION:
    BASE_PATH = "/content/drive/MyDrive/English_Vocabulary"
else:
    BASE_PATH = os.path.join(tempfile.gettempdir(), "English_Vocabulary")

# Create base directory
os.makedirs(BASE_PATH, exist_ok=True)

class VocabularyProcessor:
    def __init__(self):
        self.lesson_options = {
            "primary": [
                ("Lesson 1", "lesson-1"),
                ("Lesson 2", "lesson-2"),
                ("Lesson 3", "lesson-3"),
                ("Review", "review")
            ],
            "thcs": [
                ("Getting Started", "getting-started"),
                ("A Closer Look 1", "a-closer-look-1"),
                ("A Closer Look 2", "a-closer-look-2"),
                ("Communication", "communication"),
                ("Skills 1", "skills-1"),
                ("Skills 2", "skills-2"),
                ("Looking Back", "looking-back"),
                ("Project", "project")
            ],
            "thpt": [
                ("Getting Started", "getting-started"),
                ("Language", "language"),
                ("Reading", "reading"),
                ("Speaking", "speaking"),
                ("Listening", "listening"),
                ("Writing", "writing"),
                ("Communication and Culture", "communication-culture"),
                ("Looking Back and Project", "looking-back-project")
            ]
        }
    
    def get_lesson_choices(self, grade):
        """Get lesson options based on grade"""
        if 1 <= grade <= 5:
            return self.lesson_options["primary"]
        elif 6 <= grade <= 9:
            return self.lesson_options["thcs"]
        else:
            return self.lesson_options["thpt"]
    
    def get_lesson_value(self, grade, lesson_label):
        """Convert lesson label to value"""
        options = self.get_lesson_choices(grade)
        for label, value in options:
            if label == lesson_label:
                return value
        return options[0][1]
    
    def parse_vocabulary(self, text):
        """Parse vocabulary from markdown"""
        vocabulary_items = []
        lines = text.split('\n')
        
        for line in lines:
            # Regular vocabulary
            match = re.match(r'\*\*(.+?)\*\*:\s*\((.+?)\)\s*(.+?)\s*/(.+?)/', line)
            if match:
                vocabulary_items.append({
                    "word": match.group(1).strip(),
                    "type": match.group(2).strip(),
                    "meaning": match.group(3).strip(),
                    "pronunciation": match.group(4).strip(),
                    "irregular": False
                })
                continue
            
            # Irregular verbs
            match = re.match(r'\*\*(.+?)\s*-\s*(.+?)\s*-\s*(.+?)\*\*:\s*\(v\)\s*(.+?)\s*/(.+?)/', line)
            if match:
                pronunciations = match.group(5).split('-')
                vocabulary_items.append({
                    "word": match.group(1).strip(),
                    "v2": match.group(2).strip(),
                    "v3": match.group(3).strip(),
                    "type": "v",
                    "meaning": match.group(4).strip(),
                    "pronunciation": pronunciations[0].strip() if pronunciations else "",
                    "pronunciationV2": pronunciations[1].strip() if len(pronunciations) > 1 else "",
                    "pronunciationV3": pronunciations[2].strip() if len(pronunciations) > 2 else "",
                    "irregular": True
                })
        
        return vocabulary_items
    
    def upload_to_drive(self, file_path, folder_id=None):
        """Upload file to Google Drive"""
        if not DRIVE_INTEGRATION or not drive_service:
            return None
        
        try:
            file_name = os.path.basename(file_path)
            file_metadata = {'name': file_name}
            if folder_id:
                file_metadata['parents'] = [folder_id]
            
            media = MediaFileUpload(file_path, resumable=True)
            file = drive_service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,webViewLink'
            ).execute()
            
            return file.get('webViewLink')
        except Exception as e:
            print(f"Drive upload error: {e}")
            return None
    
    def create_drive_folder(self, name, parent_id=None):
        """Create folder in Google Drive"""
        if not DRIVE_INTEGRATION or not drive_service:
            return None
        
        try:
            file_metadata = {
                'name': name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            if parent_id:
                file_metadata['parents'] = [parent_id]
            
            folder = drive_service.files().create(
                body=file_metadata,
                fields='id'
            ).execute()
            
            return folder.get('id')
        except:
            return None
    
    def process(self, api_key, words, context, grade, unit, lesson_label, book):
        """Process vocabulary"""
        
        # Validate
        if not words.strip():
            return "❌ Vui lòng nhập từ vựng!", None, None, ""
        
        if not api_key or api_key == "YOUR_API_KEY_HERE":
            if GEMINI_API_KEY == "YOUR_API_KEY_HERE":
                return "❌ Vui lòng nhập API Key!", None, None, ""
            api_key = GEMINI_API_KEY
        
        lesson = self.get_lesson_value(grade, lesson_label)
        
        # Build prompt
        prompt = f"""Hãy trả về kết quả HOÀN TOÀN BẰNG MARKDOWN với format sau:

# Từ vựng

{"## " + context if context else ""}

[Với mỗi từ/cụm từ, format CHÍNH XÁC như sau:]

**[từ/cụm từ]**: (loại từ) nghĩa tiếng Việt /phiên âm IPA/

[Hoặc với động từ bất quy tắc:]

**[V1 - V2 - V3]**: (v) nghĩa tiếng Việt /phiên âm V1 - phiên âm V2 - phiên âm V3/

---

YÊU CẦU BẮT BUỘC:
- Output PHẢI là Markdown thuần túy
- Sử dụng ** ** cho từ/cụm từ chính
- Sử dụng / / cho phiên âm IPA
- Phiên âm IPA chuẩn British English
- Loại từ: (n) danh từ, (v) động từ, (adj) tính từ, (adv) trạng từ, (prep) giới từ, (conj) liên từ, (interj) thán từ
- Cụm từ không cần ghi loại từ
- Động từ bất quy tắc phải ghi đủ 3 dạng
- KHÔNG thêm ví dụ
- KHÔNG thêm ghi chú

Các từ/cụm từ cần xử lý:
{words}"""
        
        try:
            # Call API
            response = requests.post(
                f"{GEMINI_API_URL}?key={api_key}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.3,
                        "topK": 1,
                        "topP": 0.95,
                        "maxOutputTokens": 8192
                    }
                },
                timeout=30
            )
            
            if response.status_code != 200:
                return f"❌ API Error: {response.status_code}", None, None, ""
            
            result = response.json()
            vocabulary_text = result["candidates"][0]["content"]["parts"][0]["text"]
            
            # Parse vocabulary
            vocab_items = self.parse_vocabulary(vocabulary_text)
            
            # Create files
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename_base = f"unit-{str(unit).zfill(2)}-{lesson}-vocab-{timestamp}"
            
            # Create folder structure
            folder_path = os.path.join(BASE_PATH, f"{book}-{grade}", "vocabulary")
            os.makedirs(folder_path, exist_ok=True)
            
            # Save files
            md_path = os.path.join(folder_path, f"{filename_base}.md")
            json_path = os.path.join(folder_path, f"{filename_base}.json")
            
            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(vocabulary_text)
            
            json_data = {
                "metadata": {
                    "grade": grade,
                    "unit": unit,
                    "lesson": lesson,
                    "book": book,
                    "context": context,
                    "createdAt": datetime.now().isoformat(),
                    "totalWords": len(vocab_items)
                },
                "vocabulary": vocab_items
            }
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            
            # Upload to Drive if available
            drive_links = ""
            if DRIVE_INTEGRATION:
                md_link = self.upload_to_drive(md_path)
                json_link = self.upload_to_drive(json_path)
                if md_link:
                    drive_links = f"\n\n🔗 **Google Drive Links:**\n"
                    drive_links += f"- [Markdown File]({md_link})\n"
                    if json_link:
                        drive_links += f"- [JSON File]({json_link})"
            
            # Success message
            display_text = f"""✅ **Tạo từ vựng thành công! ({len(vocab_items)} từ)**

📁 **Files saved:**
- `{filename_base}.md`
- `{filename_base}.json`{drive_links}

---

{vocabulary_text}"""
            
            return display_text, md_path, json_path, folder_path
            
        except Exception as e:
            return f"❌ Lỗi: {str(e)}", None, None, ""

# Create processor instance
processor = VocabularyProcessor()

# Gradio Interface
def create_interface():
    with gr.Blocks(title="English Vocabulary Helper", theme=gr.themes.Soft()) as app:
        gr.Markdown(f"""
        # 📚 English Vocabulary Helper
        
        **👨‍💻 Viết bởi Nguyễn Minh Nhựt • 💰 5,000 VND/lượt/10 từ**
        
        {"🔗 **Google Drive:** Đã kết nối!" if DRIVE_INTEGRATION else "💾 **Lưu trữ:** Local"}
        
        ---
        """)
        
        with gr.Row():
            with gr.Column():
                # Inputs
                api_key = gr.Textbox(
                    label="Gemini API Key (bỏ trống nếu đã cấu hình)",
                    type="password",
                    placeholder="AIzaSy..."
                )
                
                words = gr.Textbox(
                    label="Từ vựng (mỗi từ một dòng) *",
                    lines=6,
                    placeholder="beautiful\ntake care of\nrun out of\nget up early",
                    value=""
                )
                
                context = gr.Textbox(
                    label="Ngữ cảnh",
                    placeholder="Unit 1: Family Life"
                )
                
                with gr.Row():
                    grade = gr.Slider(
                        label="Lớp *",
                        minimum=1,
                        maximum=12,
                        value=10,
                        step=1
                    )
                    
                    unit = gr.Number(
                        label="Unit *",
                        value=1,
                        minimum=1,
                        maximum=20,
                        precision=0
                    )
                
                with gr.Row():
                    lesson = gr.Dropdown(
                        label="Bài học *",
                        choices=[l[0] for l in processor.get_lesson_choices(10)],
                        value="Getting Started"
                    )
                    
                    book = gr.Radio(
                        label="Sách",
                        choices=[
                            ("Global Success", "global-success"),
                            ("English", "english"),
                            ("Khác", "other")
                        ],
                        value="global-success"
                    )
                
                submit = gr.Button("🚀 Tạo từ vựng", variant="primary", size="lg")
                
            with gr.Column():
                # Outputs
                output = gr.Markdown(
                    label="Kết quả",
                    value="*Kết quả sẽ hiển thị ở đây...*"
                )
                
                with gr.Row():
                    md_file = gr.File(label="📄 Download Markdown", visible=False)
                    json_file = gr.File(label="📊 Download JSON", visible=False)
                
                folder_info = gr.Textbox(
                    label="📁 Folder Path",
                    visible=False,
                    interactive=False
                )
        
        # Update lessons when grade changes
        def update_lessons(grade):
            lessons = processor.get_lesson_choices(int(grade))
            return gr.Dropdown(choices=[l[0] for l in lessons])
        
        grade.change(update_lessons, inputs=[grade], outputs=[lesson])
        
        # Process vocabulary
        def process_vocab(api_key, words, context, grade, unit, lesson, book):
            book_value = dict(book)[0] if isinstance(book, list) else book
            
            result, md_path, json_path, folder = processor.process(
                api_key, words, context, int(grade), 
                int(unit), lesson, book_value
            )
            
            if md_path and json_path:
                return (
                    result,
                    gr.File(value=md_path, visible=True),
                    gr.File(value=json_path, visible=True),
                    gr.Textbox(value=folder, visible=True)
                )
            else:
                return (
                    result,
                    gr.File(visible=False),
                    gr.File(visible=False),
                    gr.Textbox(visible=False)
                )
        
        submit.click(
            process_vocab,
            inputs=[api_key, words, context, grade, unit, lesson, book],
            outputs=[output, md_file, json_file, folder_info]
        )
        
        # Instructions
        gr.Markdown(f"""
        ---
        
        ### 📝 Hướng dẫn:
        1. **API Key**: Lấy tại [Google AI Studio](https://makersuite.google.com/app/apikey)
        2. **Nhập từ vựng**: Mỗi từ một dòng
        3. **Chọn thông tin**: Lớp, unit, bài học
        4. **Tạo từ vựng**: Click nút xử lý
        5. **Download**: Tải file về máy
        
        {"📂 **Lưu trữ**: Files được lưu vào Google Drive của bạn!" if IS_COLAB and DRIVE_INTEGRATION else "💾 **Lưu trữ**: Files được lưu tạm thời"}
        
        ### 🚀 Chạy app:
        - **Google Colab**: App tự động mở với share link
        - **Local**: `python vocabulary_app_complete.py`
        """)
    
    return app

# Main execution
if __name__ == "__main__":
    app = create_interface()
    
    if IS_COLAB:
        # In Colab, always create public link
        print("\n🌐 Creating public share link...")
        app.launch(share=True, debug=False)
    else:
        # Local launch
        print(f"\n💻 Running on: {platform.system()}")
        print("🌐 Creating public share link...")
        app.launch(
            share=True,
            server_name="0.0.0.0",
            server_port=7860,
            inbrowser=True
        )
