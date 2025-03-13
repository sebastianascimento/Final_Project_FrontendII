const CustomEvent = ({ event }: { event: any }) => {
  return (
    <div className="flex items-center gap-2 bg-indigo-500 text-white px-3 py-2 rounded-md shadow-md">
      <span className="font-semibold">{event.title}</span>
    </div>
  );
};

export default CustomEvent;
