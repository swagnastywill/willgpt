"use client";

export default function AdminLogoutButton() {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button
      onClick={logout}
      className="text-sm text-neutral-500 hover:text-neutral-300 underline underline-offset-2"
    >
      logout
    </button>
  );
}
