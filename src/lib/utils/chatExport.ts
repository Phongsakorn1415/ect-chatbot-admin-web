import { Message } from "../hooks/useChat";

export const exportToTxt = (messages: Message[]) => {
  const content = messages
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chat_history_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToCsv = (messages: Message[]) => {
  // BOM for Excel compatibility with UTF-8
  const BOM = "\uFEFF";
  const header = "Role,Content\n";
  const rows = messages
    .map((m) => {
      // Escape quotes and newlines for CSV format
      const content = m.content.replace(/"/g, '""');
      return `"${m.role}","${content}"`;
    })
    .join("\n");

  const blob = new Blob([BOM + header + rows], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chat_history_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
