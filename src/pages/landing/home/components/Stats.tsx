export default function Stats() {
  const stats = [
    { value: "15,234", label: "total books" },
    { value: "1,258", label: "authors" },
    { value: "20,895", label: "books sold" },
    { value: "97%", label: "happy customer" },
    { value: "15,234", label: "total books" },
    { value: "1,258", label: "authors" },
    { value: "20,895", label: "books sold" },
    { value: "97%", label: "happy customer" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex overflow-x-auto gap-8 pb-4 scrollbar-hide">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-2 whitespace-nowrap">
            <span className="w-2 h-2 bg-[#0B3B2C] rounded-full" />
            <span className="font-semibold">{stat.value}</span>
            <span className="text-gray-600">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
