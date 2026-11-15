
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type PortalRole = "customer" | "broker" | "admin";

export default function PortalLogin({ role }: { role: PortalRole }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const title = role.charAt(0).toUpperCase() + role.slice(1);
  const API = process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);
      if (data.user?.role !== role) {
        throw new Error(`This account is not a ${role} account.`);
      }

      localStorage.setItem("coverbridge_token", data.token);
      localStorage.setItem("coverbridge_user", JSON.stringify(data.user));

      router.push("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <main className="authShell">
      <section className="hero">
        <span className="eyebrow">COVERBRIDGE · {title.toUpperCase()} PORTAL</span>
        <h1>{title} Workspace</h1>
        <p>Secure access to your dedicated {role} workspace.</p>
      </section>

      <form className="panel authPanel" onSubmit={submit}>
        <a href="/">← Back to Home</a>
        <h2>{title} Login</h2>

        <label>
          Email
          <input type="email" required value={email}
            onChange={e => setEmail(e.target.value)} />
        </label>

        <label>
          Password
          <input type="password" required value={password}
            onChange={e => setPassword(e.target.value)} />
        </label>

        <button className="primary" type="submit">Sign In</button>

        {message && <p className="notice">{message}</p>}
      </form>
    </main>
  );
}
