#!/usr/bin/env node
// PreToolUse hook (Write|Edit): hỏi xác nhận trước khi sửa file secret .env* (kể cả .env.local, .env.production).
// FE tham chiếu cấu hình qua biến NEXT_PUBLIC_* / process.env, không sửa .env qua Claude.
let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let data;
  try {
    data = JSON.parse(input || '{}');
  } catch {
    process.exit(0);
  }

  const norm = (data?.tool_input?.file_path || '').replace(/\\/g, '/');

  if (/(^|\/)\.env(\.[^/]+)?$/.test(norm)) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'ask',
          permissionDecisionReason:
            'File .env giữ secret — sửa tay, không qua Claude. FE đọc config qua NEXT_PUBLIC_* / process.env.',
        },
      }),
    );
    process.exit(0);
  }

  process.exit(0);
});
