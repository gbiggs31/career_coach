import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { ensureCurrentWeekCheckin, serializeCheckinAnswers } from "@/lib/services/checkin-service";
import { CheckinForm } from "@/components/checkin-form";

export default async function CurrentCheckinPage() {
  const user = await requireUser();
  const checkin = await ensureCurrentWeekCheckin(user.id);

  if (checkin.status === "submitted") {
    redirect(`/checkins/${checkin.id}`);
  }

  const answers = await serializeCheckinAnswers(checkin.id);

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <div className="pill">~5 minutes</div>
          <h1>This week&apos;s reflection</h1>
          <p>Capture what happened while it&apos;s still fresh. Short, honest answers are enough.</p>
        </div>
      </section>
      <CheckinForm checkinId={checkin.id} initialAnswers={answers} />
    </main>
  );
}
