const fs = require('fs');
const path = 'src/features/auth/AuthContext.tsx';
let text = fs.readFileSync(path, 'utf8');
const target = "    );\n\n    const value = useMemo";
const insert = `    );\n\n  const requestPasswordReset = useCallback(\n    async (email: string) => {\n      const trimmed = email.trim();\n      if (!trimmed) {\n        throw new Error("Email is required");\n      }\n      try {\n        await api.post<ForgotPasswordResponse>("/auth/password/forgot", { email: trimmed });\n      } catch (error) {\n        if (isAxiosError(error)) {\n          const data = error.response?.data as { message?: string; error?: string } | undefined;\n          throw new Error(data?.message ?? data?.error ?? "Unable to send password reset email");\n        }\n        throw error;\n      }\n    },\n    []\n  );\n\n    const value = useMemo`;
if (!text.includes(target)) {
  throw new Error('target not found');
}
text = text.replace(target, insert);
fs.writeFileSync(path, text);
