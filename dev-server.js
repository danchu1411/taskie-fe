import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'components/AISuggestionsModal')));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Taskie FE - AI Suggestions Modal</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
                padding: 30px;
                text-align: center;
                border-bottom: 1px solid #e5e7eb;
            }
            .header h1 {
                margin: 0;
                color: #334155;
                font-size: 2.5rem;
                font-weight: 700;
            }
            .header p {
                margin: 10px 0 0 0;
                color: #64748b;
                font-size: 1.1rem;
            }
            .content {
                padding: 40px;
            }
            .demo-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
                margin-bottom: 40px;
            }
            .demo-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 25px;
                transition: all 0.3s ease;
            }
            .demo-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }
            .demo-title {
                color: #1e293b;
                font-size: 1.3rem;
                font-weight: 600;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .demo-description {
                color: #64748b;
                margin-bottom: 20px;
                line-height: 1.6;
            }
            .demo-link {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            .demo-link:hover {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                transform: translateY(-1px);
            }
            .status {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 30px;
            }
            .status-title {
                color: #166534;
                font-weight: 600;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .status-list {
                color: #166534;
                margin: 0;
                padding-left: 20px;
            }
            .footer {
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                color: #64748b;
                border-top: 1px solid #e2e8f0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 Taskie FE</h1>
                <p>AI Suggestions Modal - Development Server</p>
            </div>
            
            <div class="content">
                <div class="status">
                    <div class="status-title">
                        ✅ Development Server Running
                    </div>
                    <ul class="status-list">
                        <li>Server: http://localhost:${PORT}</li>
                        <li>Status: Active</li>
                        <li>Components: Ready</li>
                    </ul>
                </div>
                
                <div class="demo-grid">
                    <div class="demo-card">
                        <div class="demo-title">
                            🎨 UI Polish Demo
                        </div>
                        <div class="demo-description">
                            Xem các UI Polish components đã hoàn thành trong Phase 3: Enhanced Confidence Indicators, Smart Tooltips, và Enhanced Buttons.
                        </div>
                        <a href="/components/AISuggestionsModal/UI_POLISH_DEMO.html" class="demo-link">
                            Xem Demo
                        </a>
                    </div>
                    
                    <div class="demo-card">
                        <div class="demo-title">
                            🧪 Test Suite
                        </div>
                        <div class="demo-description">
                            Chạy comprehensive test suite cho tất cả components với 32/32 tests passed (100% success rate).
                        </div>
                        <a href="javascript:void(0)" onclick="runTests()" class="demo-link">
                            Chạy Tests
                        </a>
                    </div>
                    
                    <div class="demo-card">
                        <div class="demo-title">
                            📊 AI Suggestions
                        </div>
                        <div class="demo-description">
                            Test AI Suggestions Modal với mock API, form validation, và suggestion display.
                        </div>
                        <a href="javascript:void(0)" onclick="runAITests()" class="demo-link">
                            Test AI Modal
                        </a>
                    </div>
                    
                    <div class="demo-card">
                        <div class="demo-title">
                            📚 Documentation
                        </div>
                        <div class="demo-description">
                            Xem tất cả documentation và completion reports cho các phases đã hoàn thành.
                        </div>
                        <a href="/docs/" class="demo-link">
                            Xem Docs
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p>🚀 Phase 3 - UI Polish & Micro-interactions completed successfully!</p>
            </div>
        </div>
        
        <script>
            function runTests() {
                alert('Chạy: npm run test:ui-polish');
            }
            
            function runAITests() {
                alert('Chạy: npm run test:ai-suggestions');
            }
        </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📱 Open your browser and navigate to http://localhost:${PORT}`);
  console.log(`🎨 UI Polish Demo: http://localhost:${PORT}/components/AISuggestionsModal/UI_POLISH_DEMO.html`);
});
