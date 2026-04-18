"use client";

export function DeleteEventButton({ id }: { id: string }) {
  return (
    <form method="POST" action="/api/events/delete">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Delete this roll call and all its RSVPs?")) e.preventDefault();
        }}
        style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em",
          color: "var(--accent)", background: "rgba(192,57,43,0.1)",
          border: "1px solid rgba(192,57,43,0.3)", borderRadius: "4px",
          padding: "6px 12px", cursor: "pointer",
        }}
      >
        DELETE
      </button>
    </form>
  );
}
