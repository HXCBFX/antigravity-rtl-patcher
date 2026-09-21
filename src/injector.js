/**
 * Antigravity RTL Patcher - Unified Injector Generator
 * Supports Persian (فارسی), Arabic (العربية), and Hebrew (עברית)
 */

function generatePatchCode() {
    return `
    /* ANTIGRAVITY RTL PATCH - Persian / Arabic / Hebrew Support */
    win.webContents.on('console-message', (event, ...args) => {
        let message = '';
        if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
            message = args[0].message;
        } else {
            message = args[1];
        }
        if (typeof message === 'string' && message.startsWith('SAVE_RTL_CONFIG|')) {
            try {
                const data = message.substring(16);
                const configPath = require('path').join(require('os').homedir(), '.antigravity-rtl.json');
                require('fs').writeFileSync(configPath, data, 'utf8');
            } catch (e) {}
        }
    });

    win.webContents.on('dom-ready', () => {
        try {
            let fontBase64 = '';
            try {
                const fontPath = require('path').join(__dirname, 'Vazirmatn-Variable.woff2');
                if (require('fs').existsSync(fontPath)) {
                    fontBase64 = require('fs').readFileSync(fontPath).toString('base64');
                }
            } catch (e) {}

            // Load saved user config
            let rtlConfig = {
                rtlFont: '',
                enFont: '',
                codeFont: '',
                lh: '1.65',
                fs: '15',
                isRTL: true,
                forceRTL: false,
                fixAtSign: true,
                langPreset: 'persian'
            };

            try {
                const configPath = require('path').join(require('os').homedir(), '.antigravity-rtl.json');
                if (require('fs').existsSync(configPath)) {
                    const cfg = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
                    rtlConfig = { ...rtlConfig, ...cfg };
                }
            } catch (e) {}

            // Inject Client-Side RTL Engine
            win.webContents.executeJavaScript(\`
                (function() {
                    if (window.__antigravity_rtl_loaded) return;
                    window.__antigravity_rtl_loaded = true;

                    const embeddedFontBase64 = '\${fontBase64}';
                    let config = \${JSON.stringify(rtlConfig)};

                    let isRTL = config.isRTL !== false;
                    let forceRTL = config.forceRTL === true;
                    let fixAtSign = config.fixAtSign !== false;
                    let langPreset = config.langPreset || 'persian';

                    // RTL Character Regex: Hebrew (U+0590-U+05FF, U+FB1D-U+FB4F), Arabic & Persian (U+0600-U+06FF, U+0750-U+077F, U+08A0-U+08FF, U+FB50-U+FDFF, U+FE70-U+FEFC)
                    const RTL_REGEX = /[\\\\u0590-\\\\u05FF\\\\u0600-\\\\u06FF\\\\u0750-\\\\u077F\\\\u08A0-\\\\u08FF\\\\uFB1D-\\\\uFDFF\\\\uFE70-\\\\uFEFC]/;
                    const FIRST_STRONG_CHAR_REGEX = /[A-Za-z\\\\u0590-\\\\u05FF\\\\u0600-\\\\u06FF\\\\u0750-\\\\u077F\\\\u08A0-\\\\u08FF\\\\uFB1D-\\\\uFDFF\\\\uFE70-\\\\uFEFC]/;

                    // 1. Inject Styles
                    let styleTag = document.getElementById('antigravity-rtl-style');
                    if (!styleTag) {
                        styleTag = document.createElement('style');
                        styleTag.id = 'antigravity-rtl-style';
                        document.head.appendChild(styleTag);
                    }

                    let widgetStyleTag = document.getElementById('antigravity-rtl-widget-style');
                    if (!widgetStyleTag) {
                        widgetStyleTag = document.createElement('style');
                        widgetStyleTag.id = 'antigravity-rtl-widget-style';
                        widgetStyleTag.innerHTML = \\\`
                            .rtl-widget-container {
                                position: fixed;
                                bottom: 18px;
                                right: 18px;
                                z-index: 99999999;
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                                direction: ltr !important;
                                text-align: left !important;
                            }
                            .rtl-widget-trigger {
                                width: 38px;
                                height: 38px;
                                border-radius: 50%;
                                background: rgba(30, 41, 59, 0.85);
                                backdrop-filter: blur(8px);
                                -webkit-backdrop-filter: blur(8px);
                                color: #f8fafc;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                                border: 1px solid rgba(255, 255, 255, 0.15);
                                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                            }
                            .rtl-widget-trigger:hover {
                                transform: scale(1.08);
                                background: rgba(15, 23, 42, 0.95);
                                border-color: rgba(99, 102, 241, 0.6);
                            }
                            .rtl-widget-panel {
                                display: none;
                                position: absolute;
                                bottom: 48px;
                                right: 0;
                                width: 290px;
                                background: #1e293b;
                                color: #f1f5f9;
                                border-radius: 14px;
                                padding: 14px;
                                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
                                border: 1px solid #334155;
                                font-size: 13px;
                                box-sizing: border-box;
                            }
                            .rtl-widget-panel.open {
                                display: block;
                                animation: rtlPanelFadeIn 0.2s ease-out;
                            }
                            @keyframes rtlPanelFadeIn {
                                from { opacity: 0; transform: translateY(8px) scale(0.97); }
                                to { opacity: 1; transform: translateY(0) scale(1); }
                            }
                            .rtl-row {
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                margin-bottom: 10px;
                            }
                            .rtl-btn-switch {
                                position: relative;
                                width: 44px;
                                height: 24px;
                                background: #475569;
                                border-radius: 12px;
                                border: none;
                                cursor: pointer;
                                transition: background 0.2s;
                                outline: none;
                                padding: 2px;
                            }
                            .rtl-btn-switch.active {
                                background: #6366f1;
                            }
                            .rtl-btn-knob {
                                display: block;
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                background: #ffffff;
                                transform: translateX(0px);
                                transition: transform 0.2s;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                            }
                            .rtl-btn-switch.active .rtl-btn-knob {
                                transform: translateX(20px);
                            }
                            .rtl-input {
                                background: #0f172a;
                                border: 1px solid #334155;
                                color: #f8fafc;
                                padding: 4px 8px;
                                border-radius: 6px;
                                font-size: 11px;
                                width: 130px;
                                box-sizing: border-box;
                            }
                            .rtl-input:focus {
                                border-color: #6366f1;
                                outline: none;
                            }
                            .rtl-badge {
                                display: inline-block;
                                padding: 2px 6px;
                                font-size: 10px;
                                font-weight: 600;
                                border-radius: 4px;
                                cursor: pointer;
                                background: #334155;
                                color: #cbd5e1;
                                border: 1px solid transparent;
                            }
                            .rtl-badge.active {
                                background: #6366f1;
                                color: #ffffff;
                            }
                            .rtl-divider {
                                height: 1px;
                                background: #334155;
                                margin: 10px 0;
                            }
                            .rtl-slider-wrap {
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            }
                            .rtl-slider-wrap input[type="range"] {
                                flex: 1;
                                accent-color: #6366f1;
                                cursor: pointer;
                            }
                        \\\`;
                        document.head.appendChild(widgetStyleTag);
                    }

                    function updateCSS() {
                        if (!isRTL) {
                            styleTag.textContent = '';
                            return;
                        }

                        let rtlFontFamily = config.rtlFont || 'Vazirmatn, Assistant, Cairo, Heebo, "Segoe UI", sans-serif';
                        let enFontFamily = config.enFont || 'ui-sans-serif, system-ui, -apple-system, sans-serif';
                        let codeFontFamily = config.codeFont || 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
                        let lh = config.lh || '1.65';
                        let fs = config.fs || '15';

                        let embeddedFace = embeddedFontBase64 ? \\\`
                            @font-face {
                                font-family: 'VazirmatnEmbedded';
                                src: url('data:font/woff2;base64,\${embeddedFontBase64}') format('woff2');
                                font-weight: 100 900;
                                unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
                            }
                        \\\` : '';

                        let forceCSS = forceRTL ? \\\`
                            .prose > *:not(pre):not(code),
                            [data-testid="chat-message"] > *:not(pre):not(code),
                            .markdown-body > *:not(pre):not(code),
                            .leading-relaxed > *:not(pre):not(code),
                            [data-testid="user-input-step"],
                            [data-testid="user-input-step"] > *:not(pre):not(code) {
                                direction: rtl !important;
                                text-align: right !important;
                                unicode-bidi: isolate !important;
                            }
                        \\\` : '';

                        styleTag.textContent = \\\`
                            \${embeddedFace}

                            :root, :host, html, body {
                                font-family: 'VazirmatnEmbedded', \${rtlFontFamily}, \${enFontFamily}, "Apple Color Emoji", "Segoe UI Emoji" !important;
                            }

                            /* Paragraphs and Text Elements in Chat & Artifacts */
                            .prose p, .prose li, .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6,
                            .markdown-body p, .markdown-body li, .markdown-body h1, .markdown-body h2, .markdown-body h3,
                            [data-testid="chat-message"] p, [data-testid="chat-message"] li,
                            .leading-relaxed, [contenteditable="true"] p, label[for^="ask-opt-"] {
                                line-height: \${lh} !important;
                                font-size: \${fs}px !important;
                            }

                            p, h1, h2, h3, h4, h5, h6, li, [role="article"] {
                                unicode-bidi: plaintext;
                                text-align: start;
                            }

                            /* Input Areas and Editables */
                            [contenteditable="true"], textarea, input[type="text"], input:not([type]) {
                                unicode-bidi: plaintext !important;
                                text-align: start !important;
                            }

                            [contenteditable="true"][dir="rtl"], textarea[dir="rtl"] {
                                direction: rtl !important;
                                text-align: right !important;
                            }

                            [contenteditable="true"][dir="ltr"], textarea[dir="ltr"] {
                                direction: ltr !important;
                                text-align: left !important;
                            }

                            /* List Padding Fixes for RTL */
                            ul[dir="rtl"], ol[dir="rtl"],
                            [dir="rtl"] ul, [dir="rtl"] ol {
                                padding-left: 0 !important;
                                padding-right: 1.5rem !important;
                            }
                            [dir="rtl"] ul ul, [dir="rtl"] ul ol,
                            [dir="rtl"] ol ul, [dir="rtl"] ol ol {
                                padding-left: 0 !important;
                                padding-right: 2.75rem !important;
                            }

                            /* CODE BLOCKS & MONOSPACE: ALWAYS STRICT LTR */
                            pre, code, pre *, code *, kbd, .monospace,
                            [data-testid="terminal"], .terminal, .xterm,
                            .monaco-editor, .monaco-editor * {
                                direction: ltr !important;
                                text-align: left !important;
                                unicode-bidi: isolate !important;
                                font-family: \${codeFontFamily} !important;
                            }

                            /* Thinking & Internal Agent Steps (Keep LTR) */
                            .cursor-edit.text-secondary-foreground,
                            .cursor-edit.text-secondary-foreground * {
                                direction: ltr !important;
                                text-align: left !important;
                                unicode-bidi: isolate !important;
                            }

                            \${forceCSS}
                        \\\`;
                    }

                    // 2. DOM Direction Observer
                    function updateElementsDirection() {
                        if (!isRTL) return;

                        // Contenteditable and inputs
                        document.querySelectorAll('[contenteditable="true"], [contenteditable="true"] p, textarea, input[type="text"]').forEach(el => {
                            const raw = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' ? el.value : el.textContent;
                            const text = (raw || '').replace(/[\\\\u200B-\\\\u200F\\\\uFEFF]/g, '').trim();
                            if (text.length > 0) {
                                const match = text.match(FIRST_STRONG_CHAR_REGEX);
                                const isRtlText = match ? RTL_REGEX.test(match[0]) : RTL_REGEX.test(text);
                                const newDir = isRtlText ? 'rtl' : 'ltr';
                                if (el.getAttribute('dir') !== newDir) el.setAttribute('dir', newDir);
                            }
                        });

                        // Chat bubbles, paragraphs, headers, and markdown
                        const selectors = \\\`
                            .prose > *,
                            .markdown-body > *,
                            [data-testid="chat-message"] > *,
                            .leading-relaxed > *,
                            [data-testid="user-input-step"],
                            [data-testid="user-input-step"] > *,
                            label[for^="ask-opt-"]
                        \\\`;

                        document.querySelectorAll(selectors).forEach(el => {
                            if (el.tagName === 'PRE' || el.tagName === 'CODE') return;
                            const text = (el.textContent || '').replace(/[\\\\u200B-\\\\u200F\\\\uFEFF]/g, '').trim();
                            let dir = 'auto';

                            if (forceRTL) {
                                dir = 'rtl';
                            } else if (text) {
                                const match = text.match(FIRST_STRONG_CHAR_REGEX);
                                if (match) {
                                    dir = RTL_REGEX.test(match[0]) ? 'rtl' : 'ltr';
                                }
                            }

                            if (el.getAttribute('dir') !== dir) {
                                el.setAttribute('dir', dir);
                            }
                        });
                    }

                    // Bind observers
                    document.body.addEventListener('input', updateElementsDirection, { capture: true });
                    document.body.addEventListener('focusin', updateElementsDirection, { capture: true });
                    const observer = new MutationObserver(updateElementsDirection);
                    observer.observe(document.body, { childList: true, subtree: true });
                    setInterval(updateElementsDirection, 800);

                    // Keyboard shortcuts
                    document.addEventListener('keydown', (e) => {
                        // Alt + R to toggle RTL
                        if (e.altKey && e.code === 'KeyR') {
                            e.preventDefault();
                            toggleRTL(!isRTL);
                        }
                    });

                    // Persian keyboard Shift+2 '@' fix
                    document.addEventListener('keydown', (e) => {
                        if (!fixAtSign) return;
                        if (e.code === 'Digit2' && e.shiftKey) {
                            if (e.key === '٬' || e.key === '،') {
                                e.preventDefault();
                                document.execCommand('insertText', false, '@');
                            }
                        }
                    }, { capture: true });

                    // 3. Create Floating UI Widget
                    function createWidget() {
                        if (document.getElementById('antigravity-rtl-widget')) return;

                        const container = document.createElement('div');
                        container.id = 'antigravity-rtl-widget';
                        container.className = 'rtl-widget-container';
                        container.innerHTML = \\\`
                            <div id="rtl-widget-btn" class="rtl-widget-trigger" title="Antigravity RTL Settings (Alt+R)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M2 12h20"></path>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                </svg>
                            </div>

                            <div id="rtl-widget-panel" class="rtl-widget-panel">
                                <div class="rtl-row" style="border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 12px;">
                                    <strong style="font-size: 14px; display: flex; align-items: center; gap: 6px;">
                                        <span>🌐 RTL Patcher</span>
                                    </strong>
                                    <span style="font-size: 10px; color: #94a3b8;">v2.0 (Alt+R)</span>
                                </div>

                                <!-- Master Toggle -->
                                <div class="rtl-row">
                                    <span>Enable RTL</span>
                                    <button id="rtl-master-switch" class="rtl-btn-switch \\\${isRTL ? 'active' : ''}">
                                        <span class="rtl-btn-knob"></span>
                                    </button>
                                </div>

                                <!-- Force RTL -->
                                <div class="rtl-row">
                                    <span title="Forces right-alignment even on mixed text">Force Full RTL</span>
                                    <button id="rtl-force-switch" class="rtl-btn-switch \\\${forceRTL ? 'active' : ''}">
                                        <span class="rtl-btn-knob"></span>
                                    </button>
                                </div>

                                <div class="rtl-divider"></div>

                                <!-- Language Presets -->
                                <div style="margin-bottom: 8px;">
                                    <span style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 4px;">Language Preset:</span>
                                    <div style="display: flex; gap: 6px;">
                                        <span class="rtl-badge \\\${langPreset === 'persian' ? 'active' : ''}" data-lang="persian">فارسی</span>
                                        <span class="rtl-badge \\\${langPreset === 'arabic' ? 'active' : ''}" data-lang="arabic">العربية</span>
                                        <span class="rtl-badge \\\${langPreset === 'hebrew' ? 'active' : ''}" data-lang="hebrew">עברית</span>
                                        <span class="rtl-badge \\\${langPreset === 'custom' ? 'active' : ''}" data-lang="custom">Custom</span>
                                    </div>
                                </div>

                                <!-- Font Input -->
                                <div class="rtl-row" style="margin-top: 8px;">
                                    <span>RTL Font</span>
                                    <input id="rtl-font-input" type="text" class="rtl-input" value="\\\${config.rtlFont || ''}" placeholder="Vazirmatn / Assistant">
                                </div>

                                <!-- Line Height Slider -->
                                <div style="margin-top: 6px; margin-bottom: 8px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                                        <span>Line Height</span>
                                        <span id="rtl-lh-val">\\\${config.lh || '1.65'}</span>
                                    </div>
                                    <div class="rtl-slider-wrap">
                                        <input id="rtl-lh-slider" type="range" min="1.2" max="2.4" step="0.05" value="\\\${config.lh || '1.65'}">
                                    </div>
                                </div>

                                <!-- Font Size Slider -->
                                <div style="margin-top: 6px; margin-bottom: 8px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                                        <span>Font Size</span>
                                        <span id="rtl-fs-val">\\\${config.fs || '15'}px</span>
                                    </div>
                                    <div class="rtl-slider-wrap">
                                        <input id="rtl-fs-slider" type="range" min="12" max="22" step="1" value="\\\${config.fs || '15'}">
                                    </div>
                                </div>

                                <!-- Shift+2 Fix -->
                                <div class="rtl-row" style="margin-top: 10px;">
                                    <span title="Type '@' using Shift+2 in Persian layout">Shift+2 = @</span>
                                    <button id="rtl-at-switch" class="rtl-btn-switch \\\${fixAtSign ? 'active' : ''}">
                                        <span class="rtl-btn-knob"></span>
                                    </button>
                                </div>
                            </div>
                        \\\`;
                        document.body.appendChild(container);

                        // Attach Event Listeners
                        const trigger = document.getElementById('rtl-widget-btn');
                        const panel = document.getElementById('rtl-widget-panel');
                        const masterSwitch = document.getElementById('rtl-master-switch');
                        const forceSwitch = document.getElementById('rtl-force-switch');
                        const fontInput = document.getElementById('rtl-font-input');
                        const lhSlider = document.getElementById('rtl-lh-slider');
                        const lhVal = document.getElementById('rtl-lh-val');
                        const fsSlider = document.getElementById('rtl-fs-slider');
                        const fsVal = document.getElementById('rtl-fs-val');
                        const atSwitch = document.getElementById('rtl-at-switch');

                        trigger.addEventListener('click', (e) => {
                            e.stopPropagation();
                            panel.classList.toggle('open');
                        });

                        document.addEventListener('click', (e) => {
                            if (!container.contains(e.target)) {
                                panel.classList.remove('open');
                            }
                        });

                        masterSwitch.addEventListener('click', () => {
                            toggleRTL(!isRTL);
                        });

                        forceSwitch.addEventListener('click', () => {
                            forceRTL = !forceRTL;
                            forceSwitch.classList.toggle('active', forceRTL);
                            saveState();
                            updateCSS();
                            updateElementsDirection();
                        });

                        fontInput.addEventListener('change', () => {
                            config.rtlFont = fontInput.value.trim();
                            saveState();
                            updateCSS();
                        });

                        lhSlider.addEventListener('input', () => {
                            config.lh = lhSlider.value;
                            lhVal.textContent = lhSlider.value;
                            saveState();
                            updateCSS();
                        });

                        fsSlider.addEventListener('input', () => {
                            config.fs = fsSlider.value;
                            fsVal.textContent = fsSlider.value + 'px';
                            saveState();
                            updateCSS();
                        });

                        atSwitch.addEventListener('click', () => {
                            fixAtSign = !fixAtSign;
                            atSwitch.classList.toggle('active', fixAtSign);
                            saveState();
                        });

                        // Language preset badges
                        container.querySelectorAll('.rtl-badge').forEach(badge => {
                            badge.addEventListener('click', () => {
                                container.querySelectorAll('.rtl-badge').forEach(b => b.classList.remove('active'));
                                badge.classList.add('active');
                                const lang = badge.getAttribute('data-lang');
                                langPreset = lang;

                                if (lang === 'persian') {
                                    fontInput.value = 'Vazirmatn, IRANSans, Sahel, Shabnam, sans-serif';
                                } else if (lang === 'arabic') {
                                    fontInput.value = 'Cairo, Amiri, Tajawal, Almarai, Tahoma, sans-serif';
                                } else if (lang === 'hebrew') {
                                    fontInput.value = 'Assistant, Heebo, Rubik, "Segoe UI", sans-serif';
                                }
                                config.rtlFont = fontInput.value;
                                saveState();
                                updateCSS();
                                updateElementsDirection();
                            });
                        });
                    }

                    function toggleRTL(state) {
                        isRTL = state;
                        const masterSwitch = document.getElementById('rtl-master-switch');
                        if (masterSwitch) masterSwitch.classList.toggle('active', isRTL);
                        saveState();
                        updateCSS();
                        if (isRTL) {
                            updateElementsDirection();
                        } else {
                            document.querySelectorAll('[dir="rtl"]').forEach(el => el.removeAttribute('dir'));
                        }
                    }

                    function saveState() {
                        const payload = JSON.stringify({
                            isRTL,
                            forceRTL,
                            fixAtSign,
                            langPreset,
                            rtlFont: config.rtlFont || '',
                            enFont: config.enFont || '',
                            codeFont: config.codeFont || '',
                            lh: config.lh || '1.65',
                            fs: config.fs || '15'
                        });
                        console.log("SAVE_RTL_CONFIG|" + payload);
                    }

                    // Initial boot
                    updateCSS();
                    updateElementsDirection();
                    createWidget();
                })();
            \`);
        } catch (err) {
            console.error('[Antigravity RTL] Injection failed:', err);
        }
    });
    /* END ANTIGRAVITY RTL PATCH */
    `;
}

module.exports = {
    generatePatchCode,
};
