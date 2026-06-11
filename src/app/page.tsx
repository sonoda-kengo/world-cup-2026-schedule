import { ScheduleView } from "@/components/ScheduleView";
import { loadScheduleFromMarkdown } from "@/lib/scheduleMarkdown";

export default function Home() {
  const matches = loadScheduleFromMarkdown();

  return <ScheduleView matches={matches} />;
}
