const escapeCsvValue = (value) => {
  const normalizedValue = value ?? "";
  const stringValue = String(normalizedValue).replace(/"/g, '""');
  return `"${stringValue}"`;
};

export const exportArchivesToExcel = (archives = []) => {
  if (!Array.isArray(archives) || archives.length === 0) {
    return false;
  }

  const headers = [
    "Référence",
    "Titre",
    "Fichier",
    "Catégorie",
    "Date d'enregistrement",
  ];

  const rows = archives.map((archive) => [
    archive.reference,
    archive.title,
    archive.fileName,
    archive.category,
    archive.registeredAt,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(";"))
    .join("\n");

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `Rapport_Archives_ITC_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);

  return true;
};

export const exportArchivesToPdf = () => {};
