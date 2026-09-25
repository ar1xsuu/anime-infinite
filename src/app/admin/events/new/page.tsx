import { EventForm } from "@/components/admin/EventForm";

export default function NewEventPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New Event</h1>
      <EventForm event={null} />
    </div>
  );
}
