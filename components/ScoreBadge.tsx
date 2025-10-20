export default function ScoreBadge({ grade }: { grade: "A"|"B"|"C"|"D"|"F" }) {
  const color = grade === "A" ? "bg-green-500"
    : grade === "B" ? "bg-green-400"
    : grade === "C" ? "bg-warn"
    : grade === "D" ? "bg-orange-500"
    : "bg-danger";
  return (
    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-black text-2xl ${color}`}>
      {grade}
    </span>
  );
}
