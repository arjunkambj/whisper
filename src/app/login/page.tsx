"use client";

import { IconLoader2, IconLock } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Wrong password");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="mb-8 text-center">
          <IconLock className="mx-auto mb-4 size-7 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Whisper</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              autoFocus
              aria-invalid={error ? true : undefined}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || !password}
          >
            {loading ? (
              <>
                <IconLoader2 className="size-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Audio transcription powered by OpenAI Whisper
        </p>
      </div>
    </main>
  );
}
