"use client";
import "../styles/SizeGuideContent.css";

export type MeasurementChart = {
  title: string;
  unit?: string;
  diagramImage?: string;
  sizes: string[];
  rows: { label: string; values: string[] }[];
};

export default function SizeGuideContent({
  title,
  image,
  charts = [],
}: {
  title: string;
  image?: string;
  charts?: MeasurementChart[];
}) {
  if (!charts.length && !image) return null;
  return <div className="size-guide-content">
    {charts.length ? charts.map((chart, index) => <section className="size-guide-chart" key={index}>
      <h3>{chart.title || "Measurements"}</h3>
      {chart.diagramImage && <img src={chart.diagramImage} alt={`${title} ${chart.title} diagram`} />}
      {chart.rows?.length > 0 && <div className="size-guide-table-wrap">
        <table>
          <thead><tr><th>Measurement ({chart.unit || "inches"})</th>{chart.sizes.map(size => <th key={size}>{size}</th>)}</tr></thead>
          <tbody>{chart.rows.map((row, rowIndex) => <tr key={rowIndex}><th scope="row">{row.label}</th>{chart.sizes.map((_, cellIndex) => <td key={cellIndex}>{row.values[cellIndex] ?? "â€”"}</td>)}</tr>)}</tbody>
        </table>
      </div>}
    </section>) : <img src={image} alt={`${title} measurement and size guide`} />}
  </div>;
}