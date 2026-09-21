#!/usr/bin/env node

const readline = require('readline');
const { AntigravityRtlPatcher } = require('./patcher');
const { updateEditorSettings } = require('./src/editor-config');

// ANSI Colors
const C = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
};

function banner() {
    console.log(`
${C.cyan}${C.bright}=============================================================
  🌟 Antigravity RTL Patcher - Persian / Arabic / Hebrew
  پچر راست‌چین هوشمند آنتی‌گرویتی (فارسی، عربی، عبری)
=============================================================${C.reset}
`);
}

function prompt(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}

async function handleStatus(patcher) {
    const status = patcher.getStatus();
    console.log(`${C.yellow}📋 وضعیت فعلی / Current Status:${C.reset}`);
    if (!status.installed) {
        console.log(`  ❌ ${C.red}برنامه آنتی‌گرویتی یافت نشد / Antigravity not found.${C.reset}`);
        return;
    }
    console.log(`  📁 مسیر نصب / Path: ${C.cyan}${status.installDir}${C.reset}`);
    console.log(`  📦 فایل پکیج / ASAR: ${C.cyan}${status.asarPath}${C.reset}`);
    console.log(`  💾 فایل پشتیبان / Backup: ${status.hasBackup ? `${C.green}موجود است (Yes)${C.reset}` : `${C.red}وجود ندارد (No)${C.reset}`}`);
    console.log(`  ⚡ وضعیت پچ / Patched: ${status.isPatched ? `${C.green}فعال (Applied)${C.reset}` : `${C.yellow}اعمال نشده (Not patched)${C.reset}`}`);
    console.log(`  🚀 در حال اجرا / Running: ${status.isRunning ? `${C.yellow}بله (Running)${C.reset}` : `${C.green}خیر (Closed)${C.reset}`}\n`);
}

async function handlePatch(patcher) {
    console.log(`${C.cyan}⏳ در حال اعمال پچ راست‌چین... / Applying RTL patch...${C.reset}`);
    try {
        const result = await patcher.applyPatch({
            autoKill: true,
            autoRestart: false,
            updateEditor: true
        });
        console.log(`\n${C.green}✅ ${result.message}${C.reset}`);
        console.log(`${C.green}🎉 پچ راست‌چین با موفقیت اعمال شد!${C.reset}`);
        console.log(`\n${C.yellow}📌 راهنمای استفاده:${C.reset}`);
        console.log(`  • کلید میانبر فعال/غیرفعال‌سازی سریع: ${C.bright}Alt + R${C.reset}`);
        console.log(`  • ویجت شناور در گوشه پایین سمت راست پنجره آنتی‌گرویتی اضافه شد.`);
        console.log(`  • فونت فارسی وزیرمتن و فونت‌های عربی/عبری به همراه تنظیم جهت خودکار فعال شدند.`);
        console.log(`  • برای اعمال تغییرات، برنامه آنتی‌گرویتی را باز کنید.\n`);
    } catch (err) {
        console.log(`\n${C.red}❌ خطا در اعمال پچ: ${err.message}${C.reset}\n`);
    }
}

async function handleRestore(patcher) {
    console.log(`${C.yellow}⏳ در حال بازگردانی نسخه اصلی... / Restoring original...${C.reset}`);
    try {
        const result = await patcher.restoreOriginal(false);
        console.log(`\n${C.green}✅ ${result.message}${C.reset}`);
        console.log(`${C.green}نسخه اصلی آنتی‌گرویتی با موفقیت بازگردانی شد.${C.reset}\n`);
    } catch (err) {
        console.log(`\n${C.red}❌ خطا در بازگردانی: ${err.message}${C.reset}\n`);
    }
}

async function handleEditor() {
    console.log(`${C.cyan}⏳ در حال بروزرسانی فونت و تنظیمات ادیتور...${C.reset}`);
    const updated = updateEditorSettings();
    if (updated.length > 0) {
        console.log(`${C.green}✅ تنظیمات ادیتور با موفقیت بروز شد:${C.reset}`);
        updated.forEach(p => console.log(`  • ${p}`));
    } else {
        console.log(`${C.yellow}فایل تنظیمی برای ادیتور یافت نشد.${C.reset}`);
    }
    console.log('');
}

async function interactiveMenu(patcher) {
    while (true) {
        banner();
        await handleStatus(patcher);

        console.log(`${C.bright}گزینه‌ها / Options:${C.reset}`);
        console.log(`  ${C.green}1)${C.reset} اعمال پچ راست‌چین (Patch RTL - Persian / Arabic / Hebrew)`);
        console.log(`  ${C.yellow}2)${C.reset} بازگردانی نسخه اصلی کارخانه (Restore / Unpatch)`);
        console.log(`  ${C.blue}3)${C.reset} بروزرسانی تنظیمات و فونت ادیتور (Update Editor Settings)`);
        console.log(`  ${C.magenta}4)${C.reset} بررسی مجدد وضعیت (Refresh Status)`);
        console.log(`  ${C.red}5)${C.reset} خروج (Exit)\n`);

        const choice = await prompt(`${C.bright}لطفاً یک گزینه را انتخاب کنید [1-5]: ${C.reset}`);

        if (choice === '1') {
            await handlePatch(patcher);
            await prompt(`${C.cyan}کلید Enter را برای ادامه فشار دهید...${C.reset}`);
        } else if (choice === '2') {
            await handleRestore(patcher);
            await prompt(`${C.cyan}کلید Enter را برای ادامه فشار دهید...${C.reset}`);
        } else if (choice === '3') {
            await handleEditor();
            await prompt(`${C.cyan}کلید Enter را برای ادامه فشار دهید...${C.reset}`);
        } else if (choice === '4') {
            // Refreshes loop
        } else if (choice === '5' || choice.toLowerCase() === 'q') {
            console.log(`\n${C.green}خدانگهدار! / Goodbye!${C.reset}\n`);
            break;
        } else {
            console.log(`\n${C.red}گزینه نامعتبر است.${C.reset}\n`);
        }
    }
}

async function main() {
    const patcher = new AntigravityRtlPatcher();
    const args = process.argv.slice(2);

    if (args.includes('--patch') || args.includes('-p')) {
        banner();
        await handlePatch(patcher);
    } else if (args.includes('--unpatch') || args.includes('--restore') || args.includes('-u')) {
        banner();
        await handleRestore(patcher);
    } else if (args.includes('--status') || args.includes('-s')) {
        banner();
        await handleStatus(patcher);
    } else if (args.includes('--editor') || args.includes('-e')) {
        banner();
        await handleEditor();
    } else {
        await interactiveMenu(patcher);
    }
}

if (require.main === module) {
    main().catch(err => {
        console.error(`${C.red}Fatal Error:${C.reset}`, err);
        process.exit(1);
    });
}
